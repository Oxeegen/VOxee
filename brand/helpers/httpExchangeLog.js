// Main-process store for captured model HTTP exchanges (debug mode).
//
// Records exchanges reported by the renderer's debugFetch, redacts credentials,
// appends them as JSONL under userData, keeps a small in-memory ring for the
// live panel, and broadcasts each one to all windows.
//
// Registration is self-contained: call registerHttpDebugIpc(ipcMain) once from
// main.js so this stays off ipcHandlers.js.

const fs = require("fs");
const path = require("path");
const { app, BrowserWindow } = require("electron");

const SENSITIVE_HEADER = /^(authorization|api-key|x-api-key|cookie|set-cookie|proxy-authorization)$/i;
const MAX_BODY = 20000;
const RING_MAX = 200;

const ring = [];
let logFilePath = null;

function filePath() {
  if (!logFilePath) {
    logFilePath = path.join(app.getPath("userData"), "http-debug.jsonl");
  }
  return logFilePath;
}

function redactHeaders(headers) {
  const out = {};
  if (!headers || typeof headers !== "object") return out;
  for (const [k, v] of Object.entries(headers)) {
    out[k] = SENSITIVE_HEADER.test(k) ? "<redacted>" : v;
  }
  return out;
}

function redactBody(body) {
  if (typeof body !== "string") return body;
  let b = body.length > MAX_BODY ? `${body.slice(0, MAX_BODY)}…<truncated>` : body;
  // Bearer/OpenAI-style keys and inline api_key/token fields.
  b = b.replace(/sk-[A-Za-z0-9_-]{6,}/g, "sk-<redacted>");
  b = b.replace(
    /("?(?:api[_-]?key|authorization|token|bearer)"?\s*[:=]\s*"?)([^"\s,}]+)/gi,
    "$1<redacted>"
  );
  return b;
}

function record(raw) {
  const exchange = {
    id: raw.id || `${raw.timestamp || ""}-${ring.length}`,
    timestamp: raw.timestamp,
    method: raw.method,
    url: raw.url,
    status: raw.status,
    durationMs: raw.durationMs,
    requestHeaders: redactHeaders(raw.requestHeaders),
    requestBody: redactBody(raw.requestBody),
    responseBody: redactBody(raw.responseBody),
    error: raw.error,
  };

  ring.push(exchange);
  if (ring.length > RING_MAX) ring.shift();

  try {
    fs.appendFileSync(filePath(), `${JSON.stringify(exchange)}\n`);
  } catch {
    // Best-effort logging; never break the app for a debug write.
  }

  for (const win of BrowserWindow.getAllWindows()) {
    if (win && !win.isDestroyed() && win.webContents) {
      win.webContents.send("http-debug:exchange", exchange);
    }
  }

  return exchange;
}

function list() {
  return ring.slice();
}

function clear() {
  ring.length = 0;
  try {
    fs.writeFileSync(filePath(), "");
  } catch {
    // ignore
  }
}

function registerHttpDebugIpc(ipcMain) {
  ipcMain.handle("http-debug:record", (_event, raw) => record(raw || {}));
  ipcMain.handle("http-debug:list", () => list());
  ipcMain.handle("http-debug:clear", () => {
    clear();
    return true;
  });
}

module.exports = { record, list, clear, registerHttpDebugIpc };
