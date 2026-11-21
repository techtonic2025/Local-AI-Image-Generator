// system-ca.cjs — make Node trust the certificates installed in the operating system.
//
// Node ships its own list of root certificates and ignores the system store. Antivirus
// HTTPS scanning (Avast, AVG, Kaspersky, ESET, Bitdefender...) and company proxies
// re-sign every HTTPS connection with their own root certificate, which they install in
// the system store only. Browsers accept it, but Node fails with
// "self-signed certificate in certificate chain" and model downloads break.
//
// installSystemCertificates() adds the system roots to https.globalAgent, so every
// https.get/https.request in this process trusts what the browser trusts.
// Set UAIS_NO_SYSTEM_CA=1 to turn it off.

const https = require("https");
const tls = require("tls");
const fs = require("fs");
const { spawnSync } = require("child_process");

function toPem(base64) {
  const body = String(base64).replace(/\s+/g, "").match(/.{1,64}/g);
  return body ? `-----BEGIN CERTIFICATE-----\n${body.join("\n")}\n-----END CERTIFICATE-----\n` : "";
}

function splitPems(text) {
  return String(text || "").match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || [];
}

function readWindowsCertificates() {
  // Trusted roots of the machine and of the user (antivirus roots live here).
  const script = [
    "$ErrorActionPreference='SilentlyContinue'",
    "foreach ($s in 'Cert:\\LocalMachine\\Root','Cert:\\CurrentUser\\Root') {",
    "  Get-ChildItem $s | ForEach-Object { [Convert]::ToBase64String($_.RawData) }",
    "}",
  ].join("\n");
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script], {
    encoding: "utf8",
    timeout: 20000,
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0 || !result.stdout) return [];
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map(toPem).filter(Boolean);
}

function readMacCertificates() {
  const keychains = [
    "/System/Library/Keychains/SystemRootCertificates.keychain",
    "/Library/Keychains/System.keychain",
  ];
  const result = spawnSync("security", ["find-certificate", "-a", "-p", ...keychains], {
    encoding: "utf8",
    timeout: 20000,
    maxBuffer: 32 * 1024 * 1024,
  });
  return result.status === 0 ? splitPems(result.stdout) : [];
}

function readLinuxCertificates() {
  const bundles = [
    "/etc/ssl/certs/ca-certificates.crt",
    "/etc/pki/tls/certs/ca-bundle.crt",
    "/etc/ssl/ca-bundle.pem",
    "/etc/ssl/cert.pem",
  ];
  for (const bundle of bundles) {
    try { return splitPems(fs.readFileSync(bundle, "utf8")); } catch (_) {}
  }
  return [];
}

function readSystemCertificates() {
  // Newer Node versions can read the system store themselves.
  if (typeof tls.getCACertificates === "function") {
    try {
      const certs = tls.getCACertificates("system");
      if (Array.isArray(certs) && certs.length) return certs;
    } catch (_) {}
  }
  if (process.platform === "win32") return readWindowsCertificates();
  if (process.platform === "darwin") return readMacCertificates();
  return readLinuxCertificates();
}

function installSystemCertificates() {
  if (process.env.UAIS_NO_SYSTEM_CA === "1") return 0;
  let systemCerts = [];
  try {
    systemCerts = readSystemCertificates();
  } catch (err) {
    console.warn("  [certs] Could not read the system certificates:", err.message);
    return 0;
  }
  const known = new Set(tls.rootCertificates.map((pem) => pem.trim()));
  const extra = systemCerts.map((pem) => pem.trim()).filter((pem) => pem && !known.has(pem));
  if (!extra.length) return 0;
  https.globalAgent.options.ca = [...tls.rootCertificates, ...extra];
  console.log(`  [certs] Trusting ${extra.length} extra certificate(s) from the system store`);
  return extra.length;
}

module.exports = { installSystemCertificates, readSystemCertificates };
