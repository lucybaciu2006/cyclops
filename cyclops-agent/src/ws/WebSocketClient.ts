import WebSocket from 'ws';

export interface WebSocketClientOptions {
  url: string;
  headers?: Record<string, string>;
  heartbeatIntervalMs?: number;
  buildHeartbeat?: () => unknown; // optional heartbeat payload factory
  onOpen?: () => void;
  onMessage?: (msg: unknown) => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (err: Error) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectDelayMs = 1000;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(private opts: WebSocketClientOptions) {}

  sendJson(json: unknown) {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(json));
    } catch {}
  }

  sendBinary(buf: Buffer) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(buf);
  }

  connect() {
    try {
      this.ws = new WebSocket(this.opts.url, { headers: this.opts.headers });

      this.ws.on('open', () => {
        this.reconnectDelayMs = 1000;
        this.opts.onOpen?.();
        this.startHeartbeat();
      });

      this.ws.on('ping', () => { try { this.ws?.pong(); } catch {} });

      this.ws.on('message', (data) => {
        try {
          const obj = JSON.parse(data.toString());
          this.opts.onMessage?.(obj);
        } catch {
          // ignore non-JSON
        }
      });

      this.ws.on('close', (code, reason) => {
        this.stopHeartbeat();
        this.opts.onClose?.(code, reason.toString());
        this.scheduleReconnect();
      });

      this.ws.on('error', (err) => {
        this.opts.onError?.(err as Error);
        try { this.ws?.close(); } catch {}
        if (this.ws && this.ws.readyState !== WebSocket.CLOSING && this.ws.readyState !== WebSocket.CLOSED) {
          this.scheduleReconnect();
        }
      });
    } catch (e) {
      this.scheduleReconnect();
      this.opts.onError?.(e as Error);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    if (!this.opts.buildHeartbeat) return;
    const interval = this.opts.heartbeatIntervalMs ?? 15000;
    this.heartbeatTimer = setInterval(() => {
      const heartbeat = this.opts.buildHeartbeat?.();
      if (heartbeat) this.sendJson(heartbeat);
    }, interval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    this.stopHeartbeat();
    const delay = Math.min(this.reconnectDelayMs, 30000);
    setTimeout(() => this.connect(), delay);
    this.reconnectDelayMs = Math.min(delay * 2, 30000);
  }
}

