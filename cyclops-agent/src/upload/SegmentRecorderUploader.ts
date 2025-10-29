import fs from "fs";
import path from "path";
import { Storage } from "@google-cloud/storage";
import { createStorage } from "../storage/GcsClient";
import { FfmpegRecorder } from "../recording/FfmpegRecorder";

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
    private recorder: FfmpegRecorder | null = null;
    private opts?: (StartRecordOptions & {
        bucket: string;
        gcsPrefix: string;
        recordingId: string;
        outputDir: string;
        width: number;
        height: number;
        fps: number;
        crf: number;
        preset: NonNullable<StartRecordOptions['preset']>;
        metadata: Record<string, string>;
    });
    private storage: Storage = createStorage();
    private statusState: RecorderStatus = "idle";
    private currentFile?: string;

    // callbacks
    onEvent?: (evt: RecorderEvent) => void;
    onLog?: (line: string) => void;
    onError?: (line: string) => void;

    get status(): RecorderStatus { return this.statusState; }

    async start(options: StartRecordOptions): Promise<void> {
        if (this.statusState !== "idle") {
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

        // Build output path (timestamped)
        const outBasename = this.makeStartName() + ".mp4";
        const outPath = path.join(this.opts.outputDir, outBasename);
        this.currentFile = outPath;
        this.recorder = new FfmpegRecorder();
        this.recorder.onLog = (l) => this.onLog?.(l);
        this.recorder.onError = (l) => this.onError?.(l);
        this.recorder.onStart = () => {
            this.statusState = "recording";
            this.emit({ type: "started", at: new Date().toISOString() });
        };
        this.recorder.onStop = () => {
            this.emit({ type: "stopped", at: new Date().toISOString() });
        };

        await this.recorder.start({
            outputPath: outPath,
            device: this.opts.device,
            useLastDevice: this.opts.useLastDevice,
            width: this.opts.width,
            height: this.opts.height,
            fps: this.opts.fps,
            crf: this.opts.crf,
            preset: this.opts.preset,
            inputFormatLinux: this.opts.inputFormatLinux,
        });
    }

    async stop(): Promise<void> {
        if (this.statusState !== "recording" && this.statusState !== "stopping") return;
        this.statusState = "stopping";

        // Stop FFmpeg gracefully and wait for process exit
        try { await this.recorder?.stop(); } catch {}

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

    
}
