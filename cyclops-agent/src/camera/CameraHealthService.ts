import net from 'net';

export type CameraHealth = {
  url?: string;
  ip?: string;
  method: 'tcp' | 'http' | 'rtsp';
  reachable: boolean;
  lastCheck: string;
  error?: string;
};

export class CameraHealthService {
  private last: CameraHealth | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(private opts: { url?: string; ip?: string; intervalMs?: number } = {}) {}

  start() {
    const interval = this.opts.intervalMs ?? 10000;
    if (this.timer) return;
    this.timer = setInterval(() => this.check().catch(() => {}), interval);
    // kick off immediately
    this.check().catch(() => {});
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  snapshot(): CameraHealth | undefined {
    return this.last || undefined;
  }

  private async check(): Promise<void> {
    const now = new Date();
    const url = this.opts.url;
    const ip = this.opts.ip;

    let method: CameraHealth['method'] = 'tcp';
    let host = ip || undefined;
    let port = 554; // default RTSP

    if (url) {
      try {
        const u = new URL(url);
        host = u.hostname;
        if (u.protocol.startsWith('rtsp')) { method = 'rtsp'; port = Number(u.port || '554'); }
        else if (u.protocol.startsWith('http')) { method = 'http'; port = Number(u.port || (u.protocol === 'https:' ? '443' : '80')); }
        else { method = 'tcp'; port = Number(u.port || '554'); }
      } catch {
        // leave defaults
      }
    }

    if (!host) {
      this.last = { url, ip, method: 'tcp', reachable: false, lastCheck: now.toISOString(), error: 'no host' };
      return;
    }

    const reachable = await this.tcpConnect(host, port, 2000).catch((e) => ({ ok: false, error: String(e) }));
    if (typeof reachable === 'object' && 'ok' in reachable && (reachable as any).ok === false) {
      this.last = { url, ip, method, reachable: false, lastCheck: now.toISOString(), error: (reachable as any).error };
    } else {
      this.last = { url, ip, method, reachable: !!reachable, lastCheck: now.toISOString() };
    }
  }

  private tcpConnect(host: string, port: number, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const socket = net.connect({ host, port });
        let done = false;
        const finish = (ok: boolean) => { if (done) return; done = true; try { socket.destroy(); } catch {} resolve(ok); };
        const t = setTimeout(() => finish(false), timeoutMs);
        socket.on('connect', () => { clearTimeout(t); finish(true); });
        socket.on('error', () => { clearTimeout(t); finish(false); });
        socket.on('timeout', () => { clearTimeout(t); finish(false); });
      } catch {
        resolve(false);
      }
    });
  }
}

