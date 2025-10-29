import { spawn } from 'child_process';
import { Storage } from '@google-cloud/storage';
import { createStorage } from '../storage/GcsClient';

export interface SnapshotServiceOpts {
  /** Base URL for backend HTTP, e.g., http://localhost:3000 */
  serverHttpBase: string;
  locationId: string;
  apiKey: string;
  /** Camera input URL (rtsp/http) or undefined to use local device */
  inputUrl?: string;
  /** Interval seconds between snapshots */
  intervalSec?: number;
}

type LocationDoc = { _id: string; snapshotUrl?: string };

export class SnapshotService {
  private timer: NodeJS.Timeout | null = null;
  private storage: Storage = createStorage();

  constructor(private opts: SnapshotServiceOpts) {}

  start() {
    const everyMs = Math.max(5, this.opts.intervalSec ?? 30) * 1000;
    this.stop();
    const tick = async () => {
      try { await this.cycleOnce(); } catch (e: any) { console.error('[snapshot] cycle error:', e?.message || e); }
      this.timer = setTimeout(tick, everyMs);
    };
    tick();
  }

  stop() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } }

  private async cycleOnce() {
    const loc = await this.fetchLocation();
    const url = loc?.snapshotUrl;
    if (!url) return; // nothing configured
    const buf = await this.captureOnce();
    if (!buf || buf.length < 100) return;
    await this.uploadToSnapshotUrl(url, buf);
    console.log('[snapshot] uploaded', new Date().toISOString());
  }

  private async fetchLocation(): Promise<LocationDoc | null> {
    const res = await fetch(`${this.opts.serverHttpBase}/api/agents/location`, {
      headers: { 'x-location-id': this.opts.locationId, 'x-api-key': this.opts.apiKey },
    } as any);
    if (!res.ok) throw new Error(`fetch location ${res.status}`);
    return res.json();
  }

  private captureOnce(): Promise<Buffer> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      const args: string[] = [];
      const url = this.opts.inputUrl;
      if (url) {
        if (url.startsWith('rtsp://')) args.push('-rtsp_transport', 'tcp');
        args.push('-i', url);
      } else {
        // default to Windows dshow device name (adjust per platform if needed)
        args.push('-f', 'dshow', '-i', 'video=Trust USB Camera');
      }
      args.push('-vframes', '1', '-q:v', '4', '-f', 'image2', 'pipe:1');
      const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'pipe', 'inherit'] });
      ff.stdout.on('data', (d: Buffer) => chunks.push(d));
      ff.on('close', () => resolve(Buffer.concat(chunks)));
      ff.on('error', () => resolve(Buffer.alloc(0)));
    });
  }

  private async uploadToSnapshotUrl(url: string, buf: Buffer) {
    const u = new URL(url);
    let bucket: string | null = null;
    let key: string | null = null;
    // Support https://storage.googleapis.com/bucket/key and https://<bucket>.storage.googleapis.com/key
    if (u.hostname === 'storage.googleapis.com') {
      const parts = u.pathname.replace(/^\/+/, '').split('/');
      bucket = parts.shift() || null;
      key = parts.join('/');
    } else if (u.hostname.endsWith('.storage.googleapis.com')) {
      bucket = u.hostname.split('.storage.googleapis.com')[0];
      key = u.pathname.replace(/^\/+/, '');
    }
    if (bucket && key) {
      const file = this.storage.bucket(bucket).file(key);
      await file.save(buf, { contentType: 'image/jpeg', resumable: false, cacheControl: 'no-cache' });
      return;
    }
    // Fallback: try raw HTTP PUT (signed URL scenario)
    await fetch(url, { method: 'PUT', body: buf, headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-cache' } } as any);
  }
}
