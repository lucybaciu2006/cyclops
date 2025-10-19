import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { Storage } from "@google-cloud/storage";

type Platform = "linux" | "win32" | "darwin";

export type ISO = string;

export interface StartRecordOptions {
    /** Required: GCS bucket name */
    bucket: string;
    /** Prefix in GCS, e.g. "org/123/loc/abc/rec/rec_20250823_1400" (no leading slash) */
    gcsPrefix: string;
    /** Recording id for your app logic (used in callbacks/logs only) */
    recordingId: string;

    /** Local folder to write the single file (default: ./segments) */
    outputDir?: string;

    /** Camera selection */
    device?: string;        // linux: /dev/videoX; win: friendly name ("Trust Webcam ..."); mac: "0" | "1"
    useLastDevice?: boolean;

    /** Capture/encode settings */
    width?: number;         // default 1280
    height?: number;        // default 720
    fps?: number;           // default 25
    crf?: number;           // default 22 (lower = better quality)
    preset?: "ultrafast"|"superfast"|"veryfast"|"faster"|"fast"|"medium"|"slow"|"slower"|"veryslow"; // default veryfast
    inputFormatLinux?: "mjpeg" | "yuyv422" | "h264"; // optional; if your cam supports MJPEG, set "mjpeg" to reduce CPU

    /** Optional metadata to attach to the GCS object */
    metadata?: Record<string, string>;
}

export type RecorderStatus = "idle" | "recording" | "stopping";

export interface RecorderEvent {
    type:
        | "started"            // FFmpeg spawn ok
        | "stopped"            // FFmpeg exited
        | "segment-uploaded"   // (final file) uploaded to GCS
        | "segment-failed"     // (final file) upload failed
        | "drained";           // finished
    at: ISO;
    localPath?: string;
    gcsKey?: string;
    error?: string;
}

/**
 * SegmentRecorderUploader (single-file MVP)
 * - start(): begin FFmpeg writing ONE .mp4 file
 * - stop(): stop FFmpeg, then upload that ONE file to GCS
 * - status(): "idle" | "recording" | "stopping"
 */
export class SegmentRecorderUploader {
    private platform: Platform = os.platform() as Platform;
    private proc: ChildProcessWithoutNullStreams | null = null;
    private opts?: Required<StartRecordOptions>;
    private storage = new Storage({ keyFilename: "C:\\work\\certs\\cyclops-agent.json" }); // or rely on GOOGLE_APPLICATION_CREDENTIALS
    private statusState: RecorderStatus = "idle";
    private currentFile?: string;

    // callbacks
    onEvent?: (evt: RecorderEvent) => void;
    onLog?: (line: string) => void;
    onError?: (line: string) => void;

    get status(): RecorderStatus { return this.statusState; }

    async start(options: StartRecordOptions): Promise<void> {
        if (this.proc || this.statusState !== "idle") {
            this.onError?.("[rec] start() called but recorder is not idle.");
            return;
        }

        // Defaults
        this.opts = {
            bucket: options.bucket,
            gcsPrefix: options.gcsPrefix.replace(/^\/+/, ""),
            recordingId: options.recordingId,
            outputDir: options.outputDir ?? path.resolve(process.cwd(), "segments"),
            device: options.device,
            useLastDevice: options.useLastDevice ?? false,
            width: options.width ?? 1280,
            height: options.height ?? 720,
            fps: options.fps ?? 25,
            crf: options.crf ?? 22,
            preset: options.preset ?? "veryfast",
            inputFormatLinux: options.inputFormatLinux,
            metadata: options.metadata ?? {},
        };

        // Ensure local dir
        fs.mkdirSync(this.opts.outputDir, { recursive: true });

        // Choose device (explicit > last > default)
        const device = this.opts.device ?? await this.resolveDevice();
        this.onLog?.(`[rec] using device: ${device}`);

        // Build output path (timestamped)
        const outBasename = this.makeStartName() + ".mp4";
        const outPath = path.join(this.opts.outputDir, outBasename);
        this.currentFile = outPath;

        // Build FFmpeg args for single-file recording
        const args = this.buildArgs(device, outPath);
        this.onLog?.(`[rec] ffmpeg ${args.map(a => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`);

        // Start FFmpeg
        this.proc = spawn("ffmpeg", ["-hide_banner", "-loglevel", "info", ...args], {
            stdio: ["pipe", "ignore", "pipe"],
        });

        this.statusState = "recording";
        this.emit({ type: "started", at: new Date().toISOString() });

        // Log stderr (progress/errors)
        this.proc.stderr.setEncoding("utf8");
        this.proc.stderr.on("data", (d: string) => {
            const line = d.trim();
            if (!line) return;
            if (line.toLowerCase().includes("error")) this.onError?.(line);
            else this.onLog?.(line);
        });

        this.proc.on("exit", () => {
            this.proc = null;
            this.emit({ type: "stopped", at: new Date().toISOString() });
            // If stop() hasn't finished, it will continue to upload.
        });
    }

    async stop(): Promise<void> {
        if (this.statusState !== "recording" && this.statusState !== "stopping") return;
        this.statusState = "stopping";

        // Stop FFmpeg gracefully
        try { this.proc?.stdin.write("q"); } catch {}

        // Wait for FFmpeg to exit
        await new Promise<void>((resolve) => {
            if (!this.proc) return resolve();
            this.proc.once("exit", () => resolve());
        });

        // Upload the single file
        if (this.opts && this.currentFile && fs.existsSync(this.currentFile)) {
            const destKey = `${this.opts.gcsPrefix}/full.mp4`; // change if you want a per-run name
            try {
                const bucket = this.storage.bucket(this.opts.bucket);
                await bucket.upload(this.currentFile, {
                    destination: destKey,
                    resumable: true,
                    contentType: "video/mp4",
                    metadata: { metadata: { recordingId: this.opts.recordingId, ...this.opts.metadata } },
                });
                this.emit({ type: "segment-uploaded", at: new Date().toISOString(), localPath: this.currentFile, gcsKey: destKey });
                // remove local file after successful upload
                fs.unlink(this.currentFile, () => {});
            } catch (e: any) {
                this.onError?.(`[upload] final file failed: ${e?.message || e}`);
                this.emit({ type: "segment-failed", at: new Date().toISOString(), localPath: this.currentFile, error: String(e) });
                // Keep the local file in case you want to retry manually
            }
        } else {
            this.onError?.("[rec] stop(): final file missing; nothing to upload.");
        }

        this.statusState = "idle";
        this.emit({ type: "drained", at: new Date().toISOString() });
    }

    // ---------- internals ----------

    private emit(evt: RecorderEvent) { try { this.onEvent?.(evt); } catch {} }

    private makeStartName() {
        // 20250823T140000Z format
        return new Date().toISOString().replace("-", "").replace(":", "").replace(/\.\d+Z$/, "Z");
    }

    private async resolveDevice(): Promise<string> {
        // explicit device is handled by caller; here we pick last/default
        if (this.opts?.useLastDevice) {
            if (this.platform === "linux") {
                const list = fs.readdirSync("/dev")
                    .filter(n => n.startsWith("video"))
                    .map(n => `/dev/${n}`)
                    .sort((a,b) => Number(a.replace(/\D/g,"")) - Number(b.replace(/\D/g,"")));
                return list[list.length - 1] || "/dev/video0";
            }
            if (this.platform === "win32") {
                const out = await this.runFF(["-hide_banner","-f","dshow","-list_devices","true","-i","dummy"]);
                const names = Array.from(out.matchAll(/"(.+?)"\s+\(video\)/g)).map(m => m[1]);
                return names[names.length - 1] || "Integrated Camera";
            }
            // darwin
            const out = await this.runFF(["-hide_banner","-f","avfoundation","-list_devices","true","-i",""]);
            const idxs = Array.from(out.matchAll(/\[(\d+)\]\s+.+?\s+\(video\)/g)).map(m => m[1]);
            return (idxs[idxs.length - 1] ?? "0");
        }

        // defaults
        if (this.platform === "linux") return "/dev/video0";
        if (this.platform === "win32") return "Integrated Camera";
        return "0"; // mac index
    }

    private buildArgs(device: string, outPath: string): string[] {
        if (!this.opts) throw new Error("not started");
        const w = this.opts.width, h = this.opts.height, fps = this.opts.fps;
        const crf = this.opts.crf, preset = this.opts.preset;

        if (this.platform === "linux") {
            const args = [
                "-f", "v4l2",
                "-framerate", String(fps),
                "-video_size", `${w}x${h}`,
            ];
            if (this.opts.inputFormatLinux) {
                args.push("-input_format", this.opts.inputFormatLinux);
            }
            args.push(
                "-i", device,
                "-c:v", "libx264",
                "-preset", preset,
                "-crf", String(crf),
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                "-g", String(fps * 2),
                "-sc_threshold", "0",
                outPath
            );
            return args;
        }

        if (this.platform === "win32") {
            return [
                "-f", "dshow",
                "-video_size", `${w}x${h}`,
                "-framerate", String(fps),
                "-i", `video=${device}`,
                "-c:v", "libx264",
                "-preset", preset,
                "-crf", String(crf),
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                "-g", String(fps * 2),
                "-sc_threshold", "0",
                outPath
            ];
        }

        // macOS
        return [
            "-f", "avfoundation",
            "-framerate", String(fps),
            "-video_size", `${w}x${h}`,
            "-i", device,          // "0" or "1"
            "-c:v", "libx264",
            "-preset", preset,
            "-crf", String(crf),
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-g", String(fps * 2),
            "-sc_threshold", "0",
            outPath
        ];
    }

    private runFF(args: string[]): Promise<string> {
        return new Promise((resolve) => {
            const p = spawn("ffmpeg", args);
            let s = "";
            p.stderr.setEncoding("utf8");
            p.stderr.on("data", (d) => (s += d));
            p.on("close", () => resolve(s));
            p.on("error", () => resolve(s));
        });
    }
}
