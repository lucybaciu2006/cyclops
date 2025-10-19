import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export type Platform = "linux" | "win32" | "darwin";

export interface CameraOptions {
    /** Output folder for recordings & snapshots. Default: ./recordings */
    outputDir?: string;
    /** Desired resolution. Default: 1280x720 */
    width?: number;
    height?: number;
    /** Frames per second. Default: 30 */
    fps?: number;
    /**
     * Video device identifier:
     * - Linux: /dev/video0 (default)
     * - Windows: device name (e.g. `Trust Webcam`)  → we’ll map to `video=<name>`
     * - macOS:  video index string (e.g. "0" or "0:0")
     */
    device?: string;

    /** Optional audio capture (off by default) */
    includeAudio?: boolean;
    /** Audio device:
     * - Linux (ALSA): e.g. "hw:0"
     * - Windows (dshow): device name (e.g. "Microphone (USB Audio)")
     * - macOS (avfoundation): usually part of "videoIndex:audioIndex" in `device`
     */
    audioDevice?: string;

    /** H.264 encoder preset. Default: veryfast */
    preset?: "ultrafast" | "superfast" | "veryfast" | "faster" | "fast" | "medium" | "slow" | "slower" | "veryslow";
}

export class UsbCameraController {
    private proc: ChildProcessWithoutNullStreams | null = null;
    private _currentFile?: string;

    constructor(private opts: CameraOptions = {}) {}

    /** Is FFmpeg process running for recording? */
    get isRecording(): boolean {
        return !!this.proc && !this.proc.killed;
    }

    /** Full path to the current recording file (if any). */
    get currentFile(): string | undefined {
        return this._currentFile;
    }

    /** Ensure output dir exists */
    private ensureOutDir() {
        const dir = this.opts.outputDir || path.resolve(process.cwd(), "recordings");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        return dir;
    }

    /** Very light existence check that ffmpeg is available */
    static async assertFfmpegAvailable(): Promise<void> {
        return new Promise((resolve, reject) => {
            const p = spawn("ffmpeg", ["-version"]);
            let ok = false;
            p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg not found on PATH"))));
            p.on("error", (e) => reject(new Error("ffmpeg not found on PATH: " + e.message)));
        });
    }

    /** Start recording to an MP4 file. Returns the output path. */
    async startRecording(basename?: string): Promise<string> {
        if (this.isRecording) throw new Error("Recording already in progress");

        await UsbCameraController.assertFfmpegAvailable();

        const platform = (os.platform() as Platform);
        const width = this.opts.width ?? 1280;
        const height = this.opts.height ?? 720;
        const fps = this.opts.fps ?? 30;
        const preset = this.opts.preset ?? "veryfast";

        const outDir = this.ensureOutDir();
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = (basename ?? `capture_${stamp}`) + ".mp4";
        const outPath = path.join(outDir, filename);

        const args = this.buildRecordArgs(platform, { width, height, fps, preset, outPath });
        // console.log("ffmpeg", args.join(" "));

        const proc = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });
        this.proc = proc;
        this._currentFile = outPath;

        proc.stderr.setEncoding("utf8");
        proc.stderr.on("data", (chunk) => {
            // Optionally log or parse progress here
            // console.debug("[ffmpeg]", chunk.trim());
        });

        proc.on("exit", (code, signal) => {
            // Clean up state
            this.proc = null;
        });

        // Small delay to catch immediate failures (bad device, etc.)
        await new Promise((res) => setTimeout(res, 250));
        if (!this.isRecording) {
            const log = await this.consumeAll(proc);
            throw new Error("FFmpeg failed to start recording:\n" + log);
        }

        return outPath;
    }

    /** Stop recording gracefully. Resolves when file is finalized. */
    async stopRecording(timeoutMs = 4000): Promise<string | undefined> {
        if (!this.proc) return this._currentFile;

        return new Promise((resolve) => {
            let settled = false;
            const current = this._currentFile;

            // Graceful stop: send 'q' to ffmpeg to finalize MP4 moov atom
            try { this.proc!.stdin.write("q"); } catch {}

            const onDone = () => {
                if (settled) return;
                settled = true;
                this.proc = null;
                resolve(current);
            };

            this.proc.once("close", onDone);
            this.proc.once("exit", onDone);
            this.proc.once("error", onDone);

            // Fallback: hard kill if it doesn’t exit in time
            setTimeout(() => {
                if (settled) return;
                try { this.proc?.kill("SIGKILL"); } catch {}
            }, timeoutMs);
        });
    }

    /** Take a single JPEG snapshot and return path. */
    async snapshot(basename?: string): Promise<string> {
        await UsbCameraController.assertFfmpegAvailable();

        const platform = (os.platform() as Platform);
        const width = this.opts.width ?? 1280;
        const height = this.opts.height ?? 720;
        const fps = this.opts.fps ?? 30;

        const outDir = this.ensureOutDir();
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = (basename ?? `snapshot_${stamp}`) + ".jpg";
        const outPath = path.join(outDir, filename);

        const args = this.buildSnapshotArgs(platform, { width, height, fps, outPath });

        const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });

        const ok = await new Promise<boolean>((resolve) => {
            proc.on("exit", (code) => resolve(code === 0));
            proc.on("error", () => resolve(false));
        });
        if (!ok) throw new Error("FFmpeg snapshot failed");
        return outPath;
    }

    /** List video devices (best-effort, platform-specific). */
    static async listVideoDevices(): Promise<string[]> {
        const platform = os.platform() as Platform;

        if (platform === "linux") {
            // Basic: enumerate /dev/video*
            return fs.readdirSync("/dev").filter((n) => n.startsWith("video")).map((n) => "/dev/" + n);
        }

        if (platform === "win32") {
            // ffmpeg -list_devices true -f dshow -i dummy
            const out = await runAndCollect(["-hide_banner", "-f", "dshow", "-list_devices", "true", "-i", "dummy"]);
            const names = Array.from(out.matchAll(/"(.+?)"\s+\(video\)/g)).map((m) => m[1]);
            return names;
        }

        if (platform === "darwin") {
            // ffmpeg -f avfoundation -list_devices true -i ""
            const out = await runAndCollect(["-hide_banner", "-f", "avfoundation", "-list_devices", "true", "-i", ""]);
            const names = Array.from(out.matchAll(/\[(\d+)\]\s+(.+?)\s+\(video\)/g)).map((m) => `${m[1]}`); // indices as strings
            return names;
        }

        return [];
    }

    // ---------- internals ----------

    private buildRecordArgs(
        platform: Platform,
        p: { width: number; height: number; fps: number; preset: string; outPath: string }
    ): string[] {
        const device = this.opts.device;
        const includeAudio = !!this.opts.includeAudio;
        const audioDev = this.opts.audioDevice;

        if (platform === "linux") {
            const video = device || "/dev/video0";
            const args = [
                "-y",
                "-f", "v4l2",
                "-framerate", String(p.fps),
                "-video_size", `${p.width}x${p.height}`,
                "-i", video,
            ];
            if (includeAudio && audioDev) {
                args.push("-f", "alsa", "-i", audioDev);
            }
            args.push(
                "-c:v", "libx264",
                "-preset", p.preset,
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
            );
            if (includeAudio && audioDev) {
                args.push("-c:a", "aac", "-b:a", "128k");
            }
            args.push(p.outPath);
            return args;
        }

        if (platform === "win32") {
            const videoName = device || "video=Integrated Camera";
            // For dshow, input is one -i with "video=..." (and optional audio=...)
            const inSpec = includeAudio && audioDev
                ? `video=${videoName}:audio=${audioDev}`
                : `video=${videoName}`;

            return [
                "-y",
                "-f", "dshow",
                "-video_size", `${p.width}x${p.height}`,
                "-framerate", String(p.fps),
                "-i", inSpec,
                "-c:v", "libx264",
                "-preset", p.preset,
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                ...(includeAudio ? ["-c:a", "aac", "-b:a", "128k"] : []),
                p.outPath,
            ];
        }

        // macOS (avfoundation)
        // device can be "0" or "0:0" (video:audio). If only video index given and includeAudio with audioDevice provided, we’ll honor it.
        const videoSpec = device ?? "0"; // indices as strings
        const avIn = includeAudio && this.opts.audioDevice
            ? `${videoSpec}:${this.opts.audioDevice}`
            : videoSpec;

        return [
            "-y",
            "-f", "avfoundation",
            "-framerate", String(p.fps),
            "-video_size", `${p.width}x${p.height}`,
            "-i", avIn,
            "-c:v", "libx264",
            "-preset", p.preset,
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            ...(includeAudio ? ["-c:a", "aac", "-b:a", "128k"] : []),
            p.outPath,
        ];
    }

    private buildSnapshotArgs(
        platform: Platform,
        p: { width: number; height: number; fps: number; outPath: string }
    ): string[] {
        const base = this.buildRecordArgs(platform, { ...p, preset: "ultrafast", outPath: p.outPath.replace(/\.jpg$/i, ".jpg") });
        // Replace encode with single-frame
        // We'll rebuild a minimal input chain:
        const device = this.opts.device;
        const args: string[] = [];

        if (platform === "linux") {
            args.push(
                "-y",
                "-f", "v4l2",
                "-framerate", String(p.fps),
                "-video_size", `${p.width}x${p.height}`,
                "-i", device || "/dev/video0",
                "-frames:v", "1",
                "-q:v", "2",
                p.outPath
            );
            return args;
        }

        if (platform === "win32") {
            const videoName = this.opts.device || "Integrated Camera";
            args.push(
                "-y",
                "-f", "dshow",
                "-video_size", `${p.width}x${p.height}`,
                "-framerate", String(p.fps),
                "-i", `video=${videoName}`,
                "-frames:v", "1",
                "-q:v", "2",
                p.outPath
            );
            return args;
        }

        // macOS
        args.push(
            "-y",
            "-f", "avfoundation",
            "-framerate", String(p.fps),
            "-video_size", `${p.width}x${p.height}`,
            "-i", this.opts.device ?? "0",
            "-frames:v", "1",
            "-q:v", "2",
            p.outPath
        );
        return args;
    }

    private async consumeAll(p: ChildProcessWithoutNullStreams): Promise<string> {
        return new Promise((resolve) => {
            let s = "";
            p.stderr.on("data", (d) => (s += d.toString()));
            p.on("close", () => resolve(s));
            p.on("exit", () => resolve(s));
            p.on("error", () => resolve(s));
        });
    }
}

/** Helper to run ffmpeg and return combined stderr as string */
async function runAndCollect(ffmpegArgs: string[]): Promise<string> {
    return new Promise((resolve) => {
        const p = spawn("ffmpeg", ffmpegArgs, { stdio: ["ignore", "pipe", "pipe"] });
        let out = "";
        p.stderr.setEncoding("utf8");
        p.stderr.on("data", (d) => (out += d));
        p.on("close", () => resolve(out));
        p.on("exit", () => resolve(out));
        p.on("error", () => resolve(out));
    });
}
