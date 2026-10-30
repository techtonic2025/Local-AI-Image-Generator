#  Uncensored AI Studio

<p align="center">
  <strong>Uno studio AI locale premium, senza configurazione, e una GUI offline per Stable Diffusion (generazione immagini), LLM (chat), Whisper (speech-to-text) e Kokoro (text-to-speech). Alimentato da esecuzione accelerata via GPU e NPU su Windows, Linux e macOS.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Offline-100%25-green?style=for-the-badge&logo=offline" alt="100% Offline" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-blue?style=for-the-badge" alt="Piattaforme" />
  <img src="https://img.shields.io/badge/License-MIT-orange?style=for-the-badge" alt="Licenza" />
</p>




## 📖 Indice
* [Che cos’è Uncensored AI Studio?](#what-is-uncensored-ai-studio)
* [Funzionalità principali](#key-features)
* [Architettura workspace ed engine](#workspace-architecture)
* [Modelli supportati](#supported-models)
* [Architettura delle cartelle](#folder-architecture)
* [Guida introduttiva](#getting-started)
  * [Configurazione Windows](#windows-setup)
  * [Configurazione Linux](#linux-setup)
  * [Configurazione macOS](#macos-setup)
* [Compatibilità hardware e accelerazione](#hardware-compatibility-acceleration)
* [Risoluzione problemi e FAQ](#troubleshooting-faq)
* [Compilazione da sorgente](#building-from-source)
* [Licenza](#licensing)

---

## <a id="what-is-uncensored-ai-studio"></a>📖 Che cos’è Uncensored AI Studio?

**Uncensored AI Studio** è uno studio AI completamente offline, senza configurazione e autonomo per Windows, Linux e macOS. A differenza dei sistemi AI basati su cloud, funziona interamente sul tuo hardware, senza censura, tracciamento, abbonamenti o requisiti di login.

Unifica quattro grandi funzionalità AI locali in un’unica interfaccia desktop ad alte prestazioni:
1. **🎨 Generazione immagini (Stable Diffusion):** genera e modifica immagini di alta qualità offline usando pesi modello `.safetensors`, `.gguf` o `.ckpt`.
2. **💬 Chat testuale (LLM):** conversa in privato con modelli linguistici open-source (formato GGUF) alimentati dai backend ufficiali e ad alte prestazioni `llama.cpp`.
3. **🎙️ Speech-to-Text (Whisper):** trascrive registrazioni vocali e parlato in testo in tempo reale con un motore `whisper.cpp` integrato.
4. **🗣️ Text-to-Speech (Kokoro TTS):** converte output testuali in audio vocale altamente naturale e realistico offline usando il modello ONNX `Kokoro-82M`.

---

## <a id="key-features"></a>🌟 Funzionalità principali

*   **100% offline e privato:** esegue le inferenze localmente. Non richiede internet, telemetria, logging cloud o chiavi API.
*   **Portabilità senza installazione:** l’intero runtime (Node.js, modelli, backend GPU) è autonomo. Nessuna modifica globale all’ambiente di sistema.
*   **Accelerazione autoconfigurata:** rileva automaticamente le specifiche hardware per caricare backend CUDA (Nvidia), ROCm (AMD), Vulkan (Intel/AMD/NVIDIA), Metal (macOS) o OpenVINO (Intel NPU).
*   **Gestore modelli integrato:** incolla URL Hugging Face per scaricare direttamente i pesi, oppure trascina e rilascia pesi locali per importarli.
*   **Monitor prestazioni live:** monitora l’utilizzo di CPU, RAM, GPU e VRAM in tempo reale direttamente nella web UI.
*   **Galleria output locale:** salva le immagini generate affiancate ai parametri del prompt e ai file JSON dei metadati.

---

## <a id="workspace-architecture"></a>⚙️ Architettura workspace ed engine

Per evitare di esaurire la RAM o la VRAM di sistema, i motori testuali e quelli per immagini sono mutuamente esclusivi per impostazione predefinita. Puoi passare da un workspace all’altro dentro la UI:

*   **Workspace generazione immagini:** usa un nodo backend dedicato `stable-diffusion.cpp`. I pesi dei modelli sono archiviati in `app/models/`.
*   **Workspace chat testuale:** usa un backend server portatile `llama.cpp`. I pesi dei modelli (.gguf) sono archiviati in `app/llm-models/`. Un piccolo modello iniziale Qwen2.5 Coder può essere scaricato direttamente dal pannello Text Chat.
*   **Worker vocale (Whisper):** esegue un processo localizzato `whisper-cli` per convertire il tuo input vocale in testo.
*   **Output audio (Kokoro TTS):** utilizza `kokoro-js` localmente lato server per leggere le risposte con voci naturali.

---

## <a id="supported-models"></a>Modelli supportati

L’app è progettata intorno a modelli locali a file singolo che possono essere caricati direttamente dai motori backend inclusi.

### Generazione immagini

| Tipo di modello | Supportato | Inserire i file in | Note |
| :--- | :--- | :--- | :--- |
| Checkpoint Stable Diffusion 1.5 | Sì | `app/models/` | Migliore compatibilità. Usa file `.safetensors` o `.ckpt`. |
| Checkpoint SDXL | Sì | `app/models/` | Supportati come checkpoint a file singolo. Richiedono più RAM/VRAM rispetto a SD 1.5. |
| Checkpoint SD/SDXL GGUF a file singolo | Limitato | `app/models/` | Sono supportati solo checkpoint completi a file singolo. |
| Cartelle modelli immagine OpenVINO | Solo Intel NPU | `app/openvino-models/` | Scarica dal Model Manager dopo aver eseguito la configurazione OpenVINO. |
| Modelli immagine CoreML | Solo Apple Silicon | `app/models/` | Richiede macOS su Apple Silicon e il percorso di configurazione CoreML. |
| Workflow Flux, HiDream, Hunyuan, Wan, Qwen Image, Z-Image | No | N/A | Di solito richiedono file separati per diffusion, VAE e text encoder e non sono caricamenti one-click di checkpoint in questa app. |
| File LoRA, ControlNet, solo VAE, solo text encoder o solo diffusion | No | N/A | I file companion non vengono caricati come modelli immagine autonomi. |

Modelli immagine noti e funzionanti disponibili dal Model Manager:

| Nome | Nome file | Tipo | Dimensione approx. | Uso consigliato |
| :--- | :--- | :--- | :--- | :--- |
| Juggernaut XL v9 Lightning | `Juggernaut_RunDiffusionPhoto2_Lightning_4Steps.safetensors` | SDXL | 7,1 GB | Fotorealismo di alta qualità su macchine di fascia media/alta. |
| DreamShaper XL Lightning | `DreamShaperXL_Lightning.safetensors` | SDXL | 6,9 GB | Immagini SDXL generiche, fantasy, render e illustrazione. |
| DreamShaper 8 | `DreamShaper_8_pruned.safetensors` | SD 1.5 | 2,1 GB | Generazione immagini più veloce e con meno memoria. |
| CyberRealistic V8 | `CyberRealistic_V8_FP16.safetensors` | SD 1.5 | 2,0 GB | Immagini realistiche SD 1.5 e sistemi con meno memoria. |
| Rev Animated | `rev-animated-v1-2-2.safetensors` | SD 1.5 | 2,0 GB | Immagini stilizzate/anime SD 1.5. |
| LCM DreamShaper OpenVINO | `OpenVINO/LCM_Dreamshaper_v7-fp16-ov` | OpenVINO | 2,7 GB | Modello di test Intel Core Ultra NPU. |

### Testo, voce e TTS

| Workspace | File modello supportati | Inserire i file in | Note |
| :--- | :--- | :--- | :--- |
| Chat testuale | Modelli `.gguf` llama.cpp | `app/llm-models/` | Usa modelli chat/instruct GGUF a file singolo. I modelli vision possono richiedere anche un file `mmproj` corrispondente. |
| Speech-to-Text | Modelli whisper.cpp `.bin` | `app/speech-models/` | Usa file modello Whisper GGML/whisper.cpp. |
| Text-to-Speech | Manifest `.json` Kokoro e asset modello | `app/tts-models/` / `app/tts-runtime/` | Usa la configurazione Kokoro integrata e le voci del Model Manager. |

> [!NOTE]
> I binari della release Linux sono compilati per sistemi dell’era Ubuntu 24.04 e richiedono `glibc 2.38+` più `GLIBCXX_3.4.32+`. Su VM Ubuntu/Debian più vecchie, un modello come CyberRealistic può essere valido, ma il backend può comunque fallire prima di caricarlo. Aggiorna il sistema operativo della VM oppure compila il backend da sorgente.

---

## <a id="folder-architecture"></a>📁 Architettura delle cartelle

```
Uncensored-AI-Studio/
├── windows.bat                # Launcher Windows (punto di ingresso con doppio clic)
├── linux.sh                   # Launcher Linux (punto di ingresso da terminale)
├── mac.sh                     # Launcher macOS (punto di ingresso da terminale)
├── LICENSE                    # Licenza open source MIT
├── .gitignore                 # Esclude modelli e immagini di output dal controllo versione
├── README.md                  # Documentazione dettagliata del sistema
├── scripts/
│   ├── setup/                 # Configurazione piattaforma e installer backend
│   ├── reset/                 # Installazione pulita e riparazione ambiente
│   ├── server/                # Web server UI e gestore ciclo di vita backend
│   ├── workers/               # Processi worker locali
│   ├── build/                 # Helper opzionali per build da sorgente
│   └── config/                # Cataloghi configurazione runtime
└── app/
    ├── frontend/              # Codice sorgente UI (Vite + React)
    ├── models/                # Inserisci qui i pesi immagine (.safetensors, .gguf, .ckpt)
    ├── llm-models/            # Inserisci qui i pesi testuali GGUF
    └── outputs/               # Immagini salvate e metadati parametri
```

---

## <a id="getting-started"></a>🚀 Guida introduttiva

Assicurati di avere installato un browser web moderno. Segui la guida rapida qui sotto per la tua piattaforma:

### Configurazione Windows

1. **Avvio:** fai doppio clic su **`windows.bat`**.
   > [!NOTE]
   > Al primo avvio, lo script scaricherà automaticamente un runtime Node.js portatile e configurerà binari backend GPU/CPU precompilati.
2. **Aggiungi modelli:** trascina file `.safetensors`, `.gguf` o `.ckpt` dentro `app/models/` oppure scaricali tramite la scheda **Model Manager** nella UI.
3. **Genera:** apri `http://localhost:1420` nel browser, seleziona il modello e scrivi un prompt.

### Configurazione Linux

1. **Rendi eseguibile:** apri un terminale nella cartella del progetto e rendi eseguibile lo script:
   ```bash
   chmod +x linux.sh
   ```
2. **Avvio:** esegui **`./linux.sh`**.
   - **Utenti GPU NVIDIA:** ti verrà chiesto di configurare il backend **CUDA** ad alte prestazioni (scarica precompilato o compila automaticamente da sorgente come fallback).
   - **Prestazioni AMD Radeon:** esegui con **`./linux.sh --max-perf`** per aggiungere il backend ROCm (~1,3 GB di download).
   - **Intel Core Ultra NPU:** esegui con **`./linux.sh --setup-openvino`** per configurare il supporto Intel NPU (richiede driver Intel Linux NPU).
3. **Aggiungi modelli:** trascina i pesi dentro `app/models/` oppure scaricali tramite la scheda **Model Manager**.
4. **Genera:** apri `http://localhost:1420` nel browser.

### Configurazione macOS

1. **Rendi eseguibile:** apri un terminale nella cartella del progetto e rendi eseguibile lo script:
   ```bash
   chmod +x mac.sh
   ```
2. **Avvio:** esegui **`./mac.sh`**.
   > [!IMPORTANT]
   > Il backend macOS precompilato è ottimizzato per **Apple Silicon (M1 o più recente)** e usa accelerazione GPU **Metal**. *(L’hardware macOS Intel non è supportato in alcun modo)*.
3. **Aggiungi modelli:** trascina i pesi dentro `app/models/` oppure scaricali tramite la scheda **Model Manager**.
4. **Genera:** apri `http://localhost:1420` nel browser.

---

## <a id="hardware-compatibility-acceleration"></a>🖥️ Compatibilità hardware e accelerazione

### Windows

| Produttore GPU | Tecnologia | Stato | Note |
| :--- | :--- | :--- | :--- |
| **Nvidia** | CUDA | ✅ Nativo | Mappa `sd-cuda.exe` con ottimizzazioni Nvidia SDK 12. |
| **AMD Radeon** | Vulkan | ✅ Nativo | Mappa `sd-vulkan.exe` con accelerazione API Vulkan. |
| **Intel Arc** | Vulkan | ✅ Nativo | Mappa `sd-vulkan.exe` per hardware Intel. |
| **Integrata / Nessuna** | CPU | ⚠️ Fallback | Esegue sui thread logici della CPU (lento). |

### Linux

| Produttore GPU | Primario | Fallback | Note |
| :--- | :--- | :--- | :--- |
| **NVIDIA** | CUDA / Vulkan | Vulkan / CPU | Rileva automaticamente NVIDIA. La configurazione CUDA guidata scarica il precompilato o compila da sorgente. Ripiega su Vulkan per GTX. |
| **AMD Radeon** | ROCm | Vulkan | ROCm fornisce le migliori prestazioni AMD quando sono disponibili i driver ROCm dell’host. |
| **Intel Arc / integrata** | Vulkan | CPU | Supporto Vulkan cross-vendor. |
| **Intel Core Ultra NPU** | OpenVINO NPU | CPU | Richiede driver Intel Linux NPU, kernel 6.6+, Python 3 e `./linux.sh --setup-openvino`. |
| **Integrata / Nessuna** | CPU | — | Esegue sui thread logici della CPU (lento). |

### macOS

| Hardware | Primario | Fallback | Note |
| :--- | :--- | :--- | :--- |
| **Apple Silicon (M1 o più recente)** | Metal | CPU | Usa il backend ufficiale Darwin arm64 stable-diffusion.cpp. |

> [!IMPORTANT]
> **Requisiti di sistema e note:**
> - È richiesto **Windows 10 o Windows 11 a 64 bit** per il runtime Node.js 22 portatile usato dal launcher Windows.
> - È richiesto **glibc 2.38 o più recente** per i backend Linux precompilati (Ubuntu 24.04, Fedora 40+, ecc.). Lo script di configurazione ti avviserà se la tua glibc è più vecchia.
> - **Librerie runtime Linux:** i backend precompilati richiedono `libgomp.so.1`; Vulkan richiede anche `libvulkan.so.1` e un driver GPU funzionante. Lo script di configurazione ora le controlla prima di installare un backend e, se ne manca una, mostra il comando esatto per installarla sulla tua distribuzione.
> - **Linux OpenVINO NPU:** sono richiesti Intel Core Ultra, Linux x86_64, kernel 6.6+, un dispositivo `/dev/accel/accel0` funzionante, Python 3 con `venv` e il driver Intel Linux NPU.

---

## <a id="troubleshooting-faq"></a>🛠️ Risoluzione problemi e FAQ

<details>
  <summary><strong> Reset ambiente: se una build fallisce o vuoi cancellare le dipendenze</strong></summary>
  <p>Esegui <code>scripts/reset/reset.ps1</code> (Windows) oppure <code>scripts/reset/reset.sh</code> (Linux/macOS). Questo cancellerà cache temporanee di compilazione e pacchetti per riparare il tuo ambiente. <em>(Nota: conserva i pesi dei modelli e le immagini generate).</em></p>
</details>

<details>
  <summary><strong> I backend Linux non si avviano con <code>GLIBC_2.38 not found</code></strong></summary>
  <p>I binari precompilati richiedono glibc 2.38+ (es. Ubuntu 24.04). Se la tua distribuzione usa una versione più vecchia di glibc, puoi aggiornare il sistema operativo oppure compilare il backend da sorgente (vedi la guida <a href="#building-from-source">Compilazione da sorgente</a> qui sotto).</p>
</details>

<details>
  <summary><strong> Conflitti porta: indirizzo porta predefinito già occupato</strong></summary>
  <p>L’interfaccia web utente funziona sulla porta <code>1420</code> per impostazione predefinita. Il gestore backend GPU prova prima ad agganciarsi alla porta <code>8080</code>, poi rileva automaticamente e passa a una porta libera se <code>8080</code> è già occupata.</p>
</details>

<details>
  <summary><strong> Aprire lo studio da un altro dispositivo della tua rete</strong></summary>
  <p>L’interfaccia web accetta connessioni solo dal computer su cui gira, perché non ha un login. Per raggiungerla di proposito da un altro dispositivo, avviala con <code>UAIS_HOST=0.0.0.0</code> (per esempio <code>UAIS_HOST=0.0.0.0 ./linux.sh</code>, oppure <code>set UAIS_HOST=0.0.0.0</code> prima di eseguire <code>windows.bat</code>). Chiunque sia su quella rete potrà usarla.</p>
</details>

<details>
  <summary><strong> Linux ROCm non si carica per GPU AMD Radeon</strong></summary>
  <p>Assicurati che l’hardware della tua GPU AMD e il kernel host siano pienamente compatibili con ROCm 7.13. Se ROCm non riesce a inizializzarsi correttamente, l’applicazione passerà automaticamente all’accelerazione Vulkan.</p>
</details>

<details>
  <summary><strong> Linux usa la GPU integrata invece della GPU dedicata</strong></summary>
  <p>Su sistemi Linux dual-GPU, l’ordine dei dispositivi Vulkan può mettere la GPU Intel integrata su <code>vulkan0</code> e la GPU AMD/NVIDIA dedicata su <code>vulkan1</code>. Il launcher ora prova a preferire un dispositivo Vulkan dedicato quando <code>vulkaninfo --summary</code> è disponibile. Per forzare manualmente un dispositivo, avvia l’app con <code>SD_VULKAN_DEVICE=vulkan1 ./linux.sh</code> oppure usa un altro indice come <code>vulkan0</code>/<code>vulkan2</code>.</p>
</details>

<details>
  <summary><strong> Windows esce con codice <code>3221225781</code> (0xC0000135)</strong></summary>
  <p>Questo codice significa che Windows non è riuscito a trovare una DLL backend richiesta:</p>
  <ul>
    <li><strong>Per AMD/Intel Vulkan:</strong> riesegui <code>scripts/setup/setup.ps1</code>. Il setup installa il runtime Microsoft Visual C++ x64 necessario e sostituisce i binari Vulkan obsoleti con la build compatibile. Approva la richiesta di amministratore di Windows quando compare.</li>
    <li><strong>Per NVIDIA CUDA:</strong> installa o aggiorna il driver grafico NVIDIA, poi riesegui lo script di configurazione per ripristinare le DLL runtime CUDA.</li>
  </ul>
  <p>Se il setup non riesce a installare il runtime, installa manualmente il <a href="https://aka.ms/vc14/vc_redist.x64.exe">Visual C++ Redistributable x64</a> ufficiale di Microsoft, riavvia Windows e riesegui il setup.</p>
</details>

<details>
  <summary><strong> Windows esce con codice <code>3221225501</code> (0xC000001D) / "Model Load Failed"</strong></summary>
  <p>È un’istruzione CPU non supportata, dovuta a una vecchia build del backend Windows compilata per processori più recenti (succede ad esempio con CPU Intel di terza/quarta generazione). Non significa che il modello o la GPU non siano supportati. Riesegui <code>scripts/setup/setup.ps1</code>: sostituisce i binari CPU/CUDA con build che si adattano al processore in uso e installa il runtime CUDA 12.8 corrispondente (compatibile anche con le RTX serie 50).</p>
</details>

<details>
  <summary><strong> La generazione mostra "server is not responding or crashed"</strong></summary>
  <p>Questo indica che il processo del motore backend locale è terminato. Controlla il terminale di avvio (quello in cui hai eseguito <code>windows.bat</code>, <code>./linux.sh</code> o <code>./mac.sh</code>) per l’errore console esatto. Le cause comuni includono incompatibilità della versione glibc, driver Vulkan mancanti o problemi di memoria insufficiente del sistema (OOM).</p>
</details>

---

## <a id="building-from-source"></a>🔨 Compilazione da sorgente

Lo script di configurazione (`scripts/setup/setup.sh`) ora automatizza la compilazione e la configurazione del backend CUDA da sorgente quando selezionato. Se vuoi compilare manualmente tutti i backend (CPU, Vulkan e CUDA) in una volta sola, puoi eseguire lo script incluso `scripts/build/build_from_source.sh`.

Per macOS, lo script incluso `scripts/build/build_from_source.sh` compila il backend Metal e lo copia in `app/backend/mac/sd`.

### Requisiti
- `git`, `cmake`, `make` (o `ninja`) e un compilatore C++17 (`g++` / `clang++`).
- Per **CUDA**: il toolkit NVIDIA CUDA (`nvcc`) deve essere nel tuo `PATH`.
- Per **Vulkan**: Vulkan SDK / loader, un driver compatibile e `glslc` (pacchetto Ubuntu/Debian: `glslc`).
- Per **ROCm**: librerie di sviluppo AMD ROCm.
- Per **macOS Metal**: Apple Command Line Tools o Xcode.

### Comandi di build

```bash
# 1. Clona upstream
git clone https://github.com/leejet/stable-diffusion.cpp.git
cd stable-diffusion.cpp
mkdir build && cd build

# 2. Configura per il tuo backend (scegline UNO)
# Solo CPU
cmake .. -DSD_BUILD_SHARED_LIBS=ON -DCMAKE_BUILD_TYPE=Release

# CUDA
cmake .. -DSD_CUDA=ON -DSD_BUILD_SHARED_LIBS=ON -DCMAKE_BUILD_TYPE=Release

# Vulkan
cmake .. -DSD_VULKAN=ON -DSD_BUILD_SHARED_LIBS=ON -DCMAKE_BUILD_TYPE=Release

# ROCm
cmake .. -DSD_HIPBLAS=ON -DSD_BUILD_SHARED_LIBS=ON -DCMAKE_BUILD_TYPE=Release

# macOS Metal
cmake .. -DSD_METAL=ON -DSD_BUILD_SHARED_LIBS=ON -DCMAKE_BUILD_TYPE=Release

# 3. Compila
cmake --build . --config Release -j$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu)

# 4. Copia i binari in questo progetto
cp bin/sd* /path/to/Uncensored-AI-Studio/app/backend/linux/<backend>/
```

Dopo la copia, rinomina il binario server per farlo corrispondere a ciò che `scripts/server/serve.cjs` si aspetta:
- Vulkan: `sd` → `sd-vulkan`
- ROCm: `sd` → `sd-rocm`

Poi riavvia l’app con `./linux.sh` (Linux) o `./mac.sh` (macOS).

---

## <a id="licensing"></a>📝 Licenza

Questo progetto è distribuito con licenza MIT - consulta il file [LICENSE](LICENSE). Include [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp) (licenza MIT). I pesi dei modelli sono soggetti alle licenze dei rispettivi creatori.
