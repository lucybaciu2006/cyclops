"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentRecorderUploader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const storage_1 = require("@google-cloud/storage");
const FfmpegRecorder_1 = require("../recording/FfmpegRecorder");
/**
 * SegmentRecorderUploader (single-file MVP)
 * - start(): begin FFmpeg writing ONE .mp4 file
 * - stop(): stop FFmpeg, then upload that ONE file to GCS
 * - status(): "idle" | "recording" | "stopping"
 */
class SegmentRecorderUploader {
    constructor() {
        this.recorder = null;
        this.storage = new storage_1.Storage({ keyFilename: "C:\\work\\certs\\cyclops-agent.json" }); // or rely on GOOGLE_APPLICATION_CREDENTIALS
        this.statusState = "idle";
    }
    get status() { return this.statusState; }
    start(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            if (this.statusState !== "idle") {
                (_a = this.onError) === null || _a === void 0 ? void 0 : _a.call(this, "[rec] start() called but recorder is not idle.");
                return;
            }
            // Defaults
            this.opts = {
                bucket: options.bucket,
                gcsPrefix: options.gcsPrefix.replace(/^\/+/, ""),
                recordingId: options.recordingId,
                outputDir: (_b = options.outputDir) !== null && _b !== void 0 ? _b : path_1.default.resolve(process.cwd(), "segments"),
                device: options.device,
                useLastDevice: (_c = options.useLastDevice) !== null && _c !== void 0 ? _c : false,
                width: (_d = options.width) !== null && _d !== void 0 ? _d : 1280,
                height: (_e = options.height) !== null && _e !== void 0 ? _e : 720,
                fps: (_f = options.fps) !== null && _f !== void 0 ? _f : 25,
                crf: (_g = options.crf) !== null && _g !== void 0 ? _g : 22,
                preset: (_h = options.preset) !== null && _h !== void 0 ? _h : "veryfast",
                inputFormatLinux: options.inputFormatLinux,
                metadata: (_j = options.metadata) !== null && _j !== void 0 ? _j : {},
            };
            // Ensure local dir
            fs_1.default.mkdirSync(this.opts.outputDir, { recursive: true });
            // Build output path (timestamped)
            const outBasename = this.makeStartName() + ".mp4";
            const outPath = path_1.default.join(this.opts.outputDir, outBasename);
            this.currentFile = outPath;
            this.recorder = new FfmpegRecorder_1.FfmpegRecorder();
            this.recorder.onLog = (l) => { var _a; return (_a = this.onLog) === null || _a === void 0 ? void 0 : _a.call(this, l); };
            this.recorder.onError = (l) => { var _a; return (_a = this.onError) === null || _a === void 0 ? void 0 : _a.call(this, l); };
            this.recorder.onStart = () => {
                this.statusState = "recording";
                this.emit({ type: "started", at: new Date().toISOString() });
            };
            this.recorder.onStop = () => {
                this.emit({ type: "stopped", at: new Date().toISOString() });
            };
            yield this.recorder.start({
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
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (this.statusState !== "recording" && this.statusState !== "stopping")
                return;
            this.statusState = "stopping";
            // Stop FFmpeg gracefully and wait for process exit
            try {
                yield ((_a = this.recorder) === null || _a === void 0 ? void 0 : _a.stop());
            }
            catch (_d) { }
            // Upload the single file
            if (this.opts && this.currentFile && fs_1.default.existsSync(this.currentFile)) {
                const destKey = `${this.opts.gcsPrefix}/full.mp4`; // change if you want a per-run name
                try {
                    const bucket = this.storage.bucket(this.opts.bucket);
                    yield bucket.upload(this.currentFile, {
                        destination: destKey,
                        resumable: true,
                        contentType: "video/mp4",
                        metadata: { metadata: Object.assign({ recordingId: this.opts.recordingId }, this.opts.metadata) },
                    });
                    this.emit({ type: "segment-uploaded", at: new Date().toISOString(), localPath: this.currentFile, gcsKey: destKey });
                    // remove local file after successful upload
                    fs_1.default.unlink(this.currentFile, () => { });
                }
                catch (e) {
                    (_b = this.onError) === null || _b === void 0 ? void 0 : _b.call(this, `[upload] final file failed: ${(e === null || e === void 0 ? void 0 : e.message) || e}`);
                    this.emit({ type: "segment-failed", at: new Date().toISOString(), localPath: this.currentFile, error: String(e) });
                    // Keep the local file in case you want to retry manually
                }
            }
            else {
                (_c = this.onError) === null || _c === void 0 ? void 0 : _c.call(this, "[rec] stop(): final file missing; nothing to upload.");
            }
            this.statusState = "idle";
            this.emit({ type: "drained", at: new Date().toISOString() });
        });
    }
    // ---------- internals ----------
    emit(evt) { var _a; try {
        (_a = this.onEvent) === null || _a === void 0 ? void 0 : _a.call(this, evt);
    }
    catch (_b) { } }
    makeStartName() {
        // 20250823T140000Z format
        return new Date().toISOString().replace("-", "").replace(":", "").replace(/\.\d+Z$/, "Z");
    }
}
exports.SegmentRecorderUploader = SegmentRecorderUploader;
