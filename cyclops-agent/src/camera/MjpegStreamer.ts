import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import os from "os";

export type Platform = "linux" | "win32" | "darwin";

export interface PreviewOpts {
    device?: string;   // linux: /dev/video0, win: exact dshow name, mac: "0"
    width?: number;    // default 1280
    height?: number;   // default 720
    fps?: number;      // default 10
    quality?: number;  // 2(best)..31(worst) default 6
}

export class MjpegStreamer {
    private proc: ChildProcessWithoutNullStreams | null = null;
    private buffer: Buffer = Buffer.alloc(0);
    private platform: Platform = os.platform() as Platform;

    onLog?: (line: string) => void;
    onError?: (line: string) => void;
    onStart?: () => void;
    onStop?: (code: number | null) => void;

    constructor(private opts: PreviewOpts = {}) {}

    get running() { return !!this.proc && !this.proc.killed; }

    start(onFrame: (jpeg: Buffer, meta: { ts: number; w: number; h: number }) => void) {
        if (this.running) return;

        // ✅ define from opts (with defaults)
        const width   = this.opts.width   ?? 1280;
        const height  = this.opts.height  ?? 720;
        const fps     = this.opts.fps     ?? 10;
        const quality = this.opts.quality ?? 6;

        const args = this.buildArgs(width, height, fps, quality);
        // more verbose logs while debugging
        args.unshift("-hide_banner", "-loglevel", "info");

        this.proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });

        // Read MJPEG bytes from stdout and split frames by JPEG SOI/EOI
        this.proc.stdout.on("data", (chunk: Buffer) => {
            this.buffer = Buffer.concat([this.buffer, chunk]);
            // SOI = 0xFF 0xD8, EOI = 0xFF 0xD9
            const SOI = 0xffd8, EOI = 0xffd9;

            // naive scan (good enough for MJPEG over pipe)
            for (;;) {
                let i = 0, start = -1, end = -1;
                // find SOI
                for (; i + 1 < this.buffer.length; i++) {
                    const marker = (this.buffer[i] << 8) | this.buffer[i+1];
                    if (marker === SOI) { start = i; break; }
                }
                if (start < 0) break;
                // find EOI after SOI
                i = start + 2;
                for (; i + 1 < this.buffer.length; i++) {
                    const marker = (this.buffer[i] << 8) | this.buffer[i+1];
                    if (marker === EOI) { end = i + 2; break; }
                }
                if (end < 0) break;

                const jpeg = this.buffer.slice(start, end);
                this.buffer = this.buffer.slice(end);

                onFrame(jpeg, { ts: Date.now(), w: width, h: height });
            }
        });

        this.proc.stderr.setEncoding("utf8");
        this.proc.stderr.on("data", (chunk: string) => {
            const line = chunk.trim();
            if (!line) return;
            if (line.toLowerCase().includes("error")) this.onError?.(line);
            else this.onLog?.(line);
        });

        this.proc.on("spawn", () => this.onStart?.());
        this.proc.on("exit", (code) => { this.onStop?.(code ?? null); this.proc = null; this.buffer = Buffer.alloc(0); });
        this.proc.on("error", () => { this.proc = null; this.buffer = Buffer.alloc(0); });
    }

    stop() {
        if (!this.proc) return;
        try { this.proc.kill("SIGTERM"); } catch {}
        this.proc = null;
        this.buffer = Buffer.alloc(0);
    }



    private buildArgs(w: number, h: number, fps: number, q: number): string[] {
        if (this.platform === "linux") {
            const dev = this.opts.device || "/dev/video0";
            return [
                "-f", "v4l2",
                "-framerate", String(fps),
                "-video_size", `${w}x${h}`,
                "-i", dev,
                "-vf", `scale=${w}:${h}`,
                "-q:v", String(q),
                "-f", "mjpeg", "pipe:1",
            ];
        }
        if (this.platform === "win32") {
            const device = 'Trust USB Camera';
            return [
                "-f", "dshow",
                "-video_size", `${w}x${h}`,
                "-framerate", String(fps),
                "-i", `video=${device}`,
                "-vf", `scale=${w}:${h}`,
                "-q:v", String(q),
                "-f", "mjpeg", "pipe:1",
            ];
        }
        // macOS (avfoundation)
        const dev = this.opts.device || "0";
        return [
            "-f", "avfoundation",
            "-framerate", String(fps),
            "-video_size", `${w}x${h}`,
            "-i", dev,
            "-vf", `scale=${w}:${h}`,
            "-q:v", String(q),
            "-f", "mjpeg", "pipe:1",
        ];
    }
}
