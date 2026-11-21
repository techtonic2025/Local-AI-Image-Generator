// Model downloads: resume after a dropped connection, and trust system certificates.
// Run with: node --test scripts/tests/
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..", "..");
const serveSource = fs.readFileSync(path.join(root, "scripts/server/serve.cjs"), "utf8").replace(/\r\n/g, "\n");

function extract(name) {
  const start = serveSource.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `serve.cjs has no function ${name}`);
  const end = serveSource.indexOf("\n}\n", start);
  return serveSource.slice(start, end + 3);
}

function extractConst(name) {
  const match = new RegExp(`^const ${name} = [^\\n]+\\n`, "m").exec(serveSource);
  assert.ok(match, `serve.cjs has no const ${name}`);
  return match[0];
}

// Loads startModelDownload() and cancelModelDownload() from serve.cjs with the state they use.
function loadDownloader(modelsDir) {
  const context = vm.createContext({
    require, console: { log() {}, warn() {}, error() {} }, setTimeout, clearTimeout, URL,
    fs, http, https, path, MODELS: modelsDir, LLM_MODELS: modelsDir, SPEECH_MODELS: modelsDir, TTS_MODELS: modelsDir,
    formatBytes: (bytes) => `${bytes} B`,
    replaceFileWithRetry: (from, to) => fs.renameSync(from, to),
    describeDownloadHttpError: (status) => `HTTP ${status}`,
  });
  const source = [
    "let downloadState = { active: false };",
    "let activeDownload = null;",
    extractConst("MODEL_FILE_URL_HINT"),
    extractConst("MODEL_DOWNLOAD_MAX_RETRIES"),
    extractConst("MODEL_DOWNLOAD_STALL_MS").replace(/= [^;]+;/, "= 5000;"),
    extract("startModelDownload"),
    extract("describeDownloadNetworkError"),
    extract("cancelModelDownload"),
    "this.api = { startModelDownload, cancelModelDownload, state: () => downloadState };",
  ].join("\n");
  vm.runInContext(source, context);
  return context.api;
}

async function waitForEnd(api, timeoutMs = 60000) {
  const started = Date.now();
  while (api.state().active) {
    if (Date.now() - started > timeoutMs) throw new Error("download did not finish");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return api.state();
}

// A file server that supports Range and cuts the first `drops` connections halfway.
function flakyServer(body, drops) {
  const requests = [];
  const server = http.createServer((req, res) => {
    const range = /^bytes=(\d+)-$/.exec(req.headers.range || "");
    const start = range ? parseInt(range[1], 10) : 0;
    requests.push(start);
    const headers = { "content-type": "application/octet-stream", "accept-ranges": "bytes", "content-length": body.length - start };
    if (range) {
      res.writeHead(206, { ...headers, "content-range": `bytes ${start}-${body.length - 1}/${body.length}` });
    } else {
      res.writeHead(200, headers);
    }
    if (requests.length <= drops) {
      const cut = start + Math.floor((body.length - start) / 3);
      res.write(body.subarray(start, cut), () => setTimeout(() => res.socket.destroy(), 50));
      return;
    }
    res.end(body.subarray(start));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, requests })));
}

test("a dropped model download resumes where it stopped instead of failing", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "uais-dl-"));
  const body = crypto.randomBytes(8 * 1024 * 1024);
  const { server, requests } = await flakyServer(body, 2);
  try {
    const api = loadDownloader(dir);
    api.startModelDownload(`http://127.0.0.1:${server.address().port}/model.safetensors`);
    const state = await waitForEnd(api);
    assert.equal(state.error, null);
    assert.equal(requests.length, 3);
    assert.equal(requests[0], 0);
    assert.ok(requests[1] > 0 && requests[2] > requests[1], `resumed with Range: ${requests}`);
    const saved = fs.readFileSync(path.join(dir, "model.safetensors"));
    assert.ok(saved.equals(body), "the resumed file matches the original");
    assert.ok(!fs.existsSync(path.join(dir, "model.safetensors.part")));
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("cancelling a model download stops the automatic retries", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "uais-dl-"));
  const body = crypto.randomBytes(4 * 1024 * 1024);
  const { server, requests } = await flakyServer(body, 100);
  try {
    const api = loadDownloader(dir);
    api.startModelDownload(`http://127.0.0.1:${server.address().port}/model.safetensors`);
    while (requests.length < 1) await new Promise((resolve) => setTimeout(resolve, 20));
    await new Promise((resolve) => setTimeout(resolve, 300));
    api.cancelModelDownload();
    const seen = requests.length;
    await new Promise((resolve) => setTimeout(resolve, 4500));
    assert.equal(requests.length, seen, "no new request after cancel");
    assert.equal(api.state().active, false);
    assert.ok(!fs.existsSync(path.join(dir, "model.safetensors")));
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("serve.cjs trusts the system certificate store before downloading", () => {
  assert.match(serveSource, /require\("\.\/system-ca\.cjs"\)/);
  assert.match(serveSource, /installSystemCertificates\(\);/);
  const { readSystemCertificates } = require("../server/system-ca.cjs");
  const certs = readSystemCertificates();
  assert.ok(Array.isArray(certs));
  for (const pem of certs.slice(0, 5)) assert.match(pem, /-----BEGIN CERTIFICATE-----/);
});
