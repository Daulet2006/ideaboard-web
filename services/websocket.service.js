const readEnv = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return "";
  return trimmed;
};

const stripTrailingSlash = (value) => value.replace(/\/+$/, "");

const normalizePath = (value, fallback) => {
  const raw = readEnv(value) || fallback;
  if (raw.startsWith("/")) return raw;
  return `/${raw}`;
};

const toWsOrigin = (urlLike) => {
  try {
    const parsed = new URL(urlLike);
    if (parsed.protocol === "http:") return `ws://${parsed.host}`;
    if (parsed.protocol === "https:") return `wss://${parsed.host}`;
    if (parsed.protocol === "ws:" || parsed.protocol === "wss:") return `${parsed.protocol}//${parsed.host}`;
  } catch {
    // fall through to default
  }
  return "ws://localhost:5000";
};

const API_URL = readEnv(process.env.NEXT_PUBLIC_API_URL) || "http://localhost:5000";
const WS_BASE = readEnv(process.env.NEXT_PUBLIC_WS_URL) || toWsOrigin(API_URL);
const WS_PATH = normalizePath(process.env.NEXT_PUBLIC_WS_PATH, "/ws");
const WS_URL = `${stripTrailingSlash(WS_BASE)}${WS_PATH}`;
const PING_INTERVAL = 30000;
const MIN_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

class WebSocketService {
  constructor() {
    this.ws = null;
    this.token = null;
    this.listeners = {};
    this.reconnectDelay = MIN_RECONNECT_DELAY;
    this.pingTimer = null;
    this.reconnectTimer = null;
    this.shouldReconnect = false;
    this.isConnecting = false;
  }

  connect(token) {
    if (this.isConnecting) return;
    this.token = token;
    this.shouldReconnect = true;
    this._connect();
  }

  _connect() {
    if (!this.token || typeof window === 'undefined') return;
    this.isConnecting = true;

    try {
      const url = `${WS_URL}?token=${this.token}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectDelay = MIN_RECONNECT_DELAY;
        this._startPing();
        this._emit('_connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg && msg.type) {
            this._emit(msg.type, msg.payload);
          }
        } catch {
          // ignore malformed messages
        }
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this._stopPing();
        this._emit('_disconnected', { code: event.code });

        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectDelay = Math.min(
              this.reconnectDelay * 2,
              MAX_RECONNECT_DELAY
            );
            this._connect();
          }, this.reconnectDelay);
        }
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        if (this.ws) this.ws.close();
      };
    } catch {
      this.isConnecting = false;
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.token = null;
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  _startPing() {
    this._stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'PING' });
    }, PING_INTERVAL);
  }

  _stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  send(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  _emit(event, payload) {
    const callbacks = this.listeners[event] || [];
    callbacks.forEach((cb) => {
      try {
        cb(payload);
      } catch {
        // ignore listener errors
      }
    });
  }
}

export const wsService = new WebSocketService();
