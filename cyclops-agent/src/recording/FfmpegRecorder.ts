import { spawn, ChildProcess } from 'child_process';
import os from 'os';

export type Platform = 'linux' | 'win32' | 'darwin';

export type RecorderState = 'idle' | 'recording' | 'stopping';

export interface RecorderStartOptions {
  outputPath: string;
  device?: string;
  useLastDevice?: boolean;
  width?: number;    // default 1280
  height?: number;   // default 720
  fps?: number;      // default 25
  crf?: number;      // default 22
  preset?: 'ultrafast'|'superfast'|'veryfast'|'faster'|'fast'|'medium'|'slow'|'slower'|'veryslow';
  inputFormatLinux?: 'mjpeg' | 'yuyv422' | 'h264';
}

export class FfmpegRecorder {
  private platform: Platform = os.platform() as Platform;
  private proc: ChildProcess | null = null;
  private opts?: (RecorderStartOptions & {
    width: number;
    height: number;
    fps: number;
    crf: number;
    preset: NonNullable<RecorderStartOptions['preset']>;
  });
  private state: RecorderState = 'idle';

  onStart?: () => void;
  onStop?: () => void;
  onLog?: (line: string) => void;
  onError?: (line: string) => void;

  get status(): RecorderState { return this.state; }

  async start(options: RecorderStartOptions): Promise<void> {
    if (this.proc || this.state !== 'idle') {
      this.onError?.('[ffrec] start() called but recorder is not idle.');
      return;
    }

    // Defaults
    this.opts = {
      outputPath: options.outputPath,
      device: options.device,
      useLastDevice: options.useLastDevice ?? false,
      width: options.width ?? 1280,
      height: options.height ?? 720,
      fps: options.fps ?? 25,
      crf: options.crf ?? 22,
      preset: options.preset ?? 'veryfast',
      inputFormatLinux: options.inputFormatLinux,
    };

    const device = this.opts.device ?? await this.resolveDevice();
    this.onLog?.(`[ffrec] using device: ${device}`);

    const args = this.buildArgs(device, this.opts.outputPath);
    this.onLog?.(`[ffrec] ffmpeg ${args.map(a => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`);

    this.proc = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'info', ...args], { stdio: ['pipe', 'ignore', 'pipe'] });
    this.state = 'recording';
    try { this.onStart?.(); } catch {}

    this.proc.stderr?.setEncoding('utf8');
    this.proc.stderr?.on('data', (d: string) => {
      const line = d.trim();
      if (!line) return;
      if (line.toLowerCase().includes('error')) this.onError?.(line); else this.onLog?.(line);
    });

    this.proc.on('exit', () => {
      this.proc = null;
      this.state = 'idle';
      try { this.onStop?.(); } catch {}
    });
  }

  async stop(): Promise<void> {
    if (this.state !== 'recording' && this.state !== 'stopping') return;
    this.state = 'stopping';
    try { this.proc?.stdin?.write('q'); } catch {}
    await new Promise<void>((resolve) => {
      if (!this.proc) return resolve();
      this.proc.once('exit', () => resolve());
    });
  }

  // ---------- internals ----------

  private async resolveDevice(): Promise<string> {
    if (this.opts?.useLastDevice) {
      if (this.platform === 'linux') {
        // prefer highest /dev/videoN
        try {
          const fs = await import('fs');
          const list = fs.readdirSync('/dev')
            .filter(n => n.startsWith('video'))
            .map(n => `/dev/${n}`)
            .sort((a,b) => Number(a.replace(/\D/g,'')) - Number(b.replace(/\D/g,'')));
          return list[list.length - 1] || '/dev/video0';
        } catch { /* ignore */ }
      }
      if (this.platform === 'win32') {
        const out = await this.runFF(['-hide_banner','-f','dshow','-list_devices','true','-i','dummy']);
        const names = Array.from(out.matchAll(/"(.+?)"\s+\(video\)/g)).map(m => m[1]);
        return names[names.length - 1] || 'Integrated Camera';
      }
      // darwin
      const out = await this.runFF(['-hide_banner','-f','avfoundation','-list_devices','true','-i','']);
      const idxs = Array.from(out.matchAll(/\[(\d+)\]\s+.+?\s+\(video\)/g)).map(m => m[1]);
      return (idxs[idxs.length - 1] ?? '0');
    }

    if (this.platform === 'linux') return '/dev/video0';
    if (this.platform === 'win32') return 'Integrated Camera';
    return '0';
  }

  private buildArgs(device: string, outPath: string): string[] {
    if (!this.opts) throw new Error('not started');
    const w = this.opts.width, h = this.opts.height, fps = this.opts.fps;
    const crf = this.opts.crf, preset = this.opts.preset;

    if (this.platform === 'linux') {
      const args = [
        '-f', 'v4l2',
        '-framerate', String(fps),
        '-video_size', `${w}x${h}`,
      ];
      if (this.opts.inputFormatLinux) args.push('-input_format', this.opts.inputFormatLinux);
      args.push(
        '-i', device,
        '-c:v', 'libx264',
        '-preset', preset,
        '-crf', String(crf),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-g', String(fps * 2),
        '-sc_threshold', '0',
        outPath
      );
      return args;
    }

    if (this.platform === 'win32') {
      return [
        '-f', 'dshow',
        '-video_size', `${w}x${h}`,
        '-framerate', String(fps),
        '-i', `video=${device}`,
        '-c:v', 'libx264',
        '-preset', preset,
        '-crf', String(crf),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-g', String(fps * 2),
        '-sc_threshold', '0',
        outPath,
      ];
    }

    // macOS
    return [
      '-f', 'avfoundation',
      '-framerate', String(fps),
      '-video_size', `${w}x${h}`,
      '-i', device,
      '-c:v', 'libx264',
      '-preset', preset,
      '-crf', String(crf),
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-g', String(fps * 2),
      '-sc_threshold', '0',
      outPath,
    ];
  }

  private runFF(args: string[]): Promise<string> {
    return new Promise((resolve) => {
      const p = spawn('ffmpeg', args);
      let s = '';
      p.stderr.setEncoding('utf8');
      p.stderr.on('data', (d) => (s += d));
      p.on('close', () => resolve(s));
      p.on('error', () => resolve(s));
    });
  }
}
