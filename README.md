<p align="center">
  <img src="brand/assets/voxee.png" alt="VOxee" width="120" />
</p>

<h1 align="center">VOxee</h1>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey?style=flat" alt="Platform" />
  <img src="https://img.shields.io/badge/models-Oxeegen-5E4AF5?style=flat" alt="Oxeegen models" />
  <a href="https://github.com/OpenWhispr/openwhispr"><img src="https://img.shields.io/badge/based%20on-OpenWhispr-3178c6?style=flat" alt="Based on OpenWhispr" /></a>
</p>

<p align="center">
  Oxeegen's voice-to-text desktop app — dictation, meeting transcription, and notes,<br/>
  powered by <strong>Oxeegen's self-hosted AI models</strong> out of the box. For macOS, Windows, and Linux.
</p>

---

**VOxee** turns your voice into text, notes, and actions from your desktop. Press a hotkey, speak, and your words appear at your cursor.

By default it points at **Oxeegen's self-hosted, OpenAI-compatible endpoints** for transcription and AI — enter the shared organization key once and everything works, with no personal accounts, sign-in, or per-provider API keys. Any scope can be pointed at your own custom OpenAI-compatible endpoint instead.

> VOxee is a rebranded, Oxeegen-configured fork of **[OpenWhispr](https://github.com/OpenWhispr/openwhispr)** (MIT). Brand-specific configuration lives under [`brand/`](brand/); upstream changes are merged in periodically.

## Oxeegen by default

- **No accounts, no BYOK setup** — VOxee ships pre-pointed at Oxeegen's endpoints; the user enters a single shared organization API key.
- **Per-scope models** — transcription, dictation cleanup, dictation agent, translation, note formatting, and chat each resolve to an Oxeegen model.
- **Oxeegen or Custom** — every model screen offers a locked **Oxeegen** choice or a **Custom** OpenAI-compatible endpoint (your own URL, key, and model).

## Features

- **Voice dictation** — global hotkey to dictate into any app with automatic pasting
- **Dictation translation** — dedicated hotkey to dictate in one language and paste the text in another
- **AI agent** — a named voice assistant backed by Oxeegen models (or any custom endpoint)
- **Voice agent hotkey** — sends your dictation straight to the agent as a command — no wake word, no cleanup pass
- **Meeting transcription** — auto-detect Zoom, Teams, and FaceTime calls, with **self-hosted realtime transcription** over the OpenAI-compatible `/v1/realtime` WebSocket, an automatic **batch fallback** (buffered `/v1/audio/transcriptions`) when realtime isn't available, and a **configurable chunk interval**
- **Speaker diarization** — on-device voice fingerprinting separates remote participants across meeting audio; your local mic is labelled as you
- **Notes** — create, organize, and search notes with folders, always-on offline **semantic search**, and AI actions
- **Audio import** — transcribe existing audio and video: drag in files, batch-upload, or paste a YouTube/audio URL
- **Prompt studio** — view, customize, and test the system prompt for each scope; VOxee ships versioned default prompts
- **HTTP debug panel** — inspect model requests and responses in-app to troubleshoot self-hosted endpoints
- **Bring your own endpoint** — switch any scope to a custom OpenAI-compatible endpoint; local engines (Whisper, NVIDIA Parakeet, GGUF via llama.cpp) are supported by the underlying app

## Configuration

Deployment config lives in the root `.env` (see [`.env.example`](.env.example)) and is baked at build time:

- `VITE_OXEE_ENDPOINT` — shared OpenAI-compatible base URL (with `/v1`)
- `VITE_OXEE_MODEL_*` — per-scope Oxeegen model ids

Brand values (product name, app id, theme, feature flags, versioned default prompts) live in [`brand/config/`](brand/config/). Windows packaging must run on a native Windows host.

## Quick start

```bash
git clone https://github.com/Oxeegen/VOxee.git
cd VOxee
npm install
npm run dev
```

Requires Node.js 24+.

## Tech stack

React 19, TypeScript, Tailwind CSS v4, Electron 41, better-sqlite3, whisper.cpp, sherpa-onnx, shadcn/ui.

## Built on OpenWhispr

VOxee is a fork of **[OpenWhispr](https://github.com/OpenWhispr/openwhispr)**, the open-source, privacy-first dictation app. Upstream documentation applies to most core features:

- [OpenWhispr docs](https://docs.openwhispr.com) — quickstart, platform guides, troubleshooting

## License

[MIT](LICENSE) — inherited from OpenWhispr.

## Acknowledgments

- **[OpenWhispr](https://github.com/OpenWhispr/openwhispr)** — the upstream project VOxee is built on
- **[OpenAI Whisper](https://github.com/openai/whisper)** — speech recognition model powering local and cloud transcription
- **[whisper.cpp](https://github.com/ggerganov/whisper.cpp)** — high-performance C++ implementation for local processing
- **[NVIDIA Parakeet](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3)** — fast multilingual ASR model
- **[sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx)** — cross-platform ONNX runtime for Parakeet inference
- **[llama.cpp](https://github.com/ggerganov/llama.cpp)** — local LLM inference for AI text processing
- **[Electron](https://www.electronjs.org/)** — cross-platform desktop framework
- **[React](https://react.dev/)** — UI component library
- **[shadcn/ui](https://ui.shadcn.com/)** — accessible components built on Radix primitives
