"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MjpegStreamer = void 0;
const child_process_1 = require("child_process");
const os_1 = __importDefault(require("os"));
class MjpegStreamer {
    constructor(opts = {}) {
        this.opts = opts;
        this.proc = null;
        this.buffer = Buffer.alloc(0);
        this.platform = os_1.default.platform();
    }
    get running() { return !!this.proc && !this.proc.killed; }
    start(onFrame) {
        var _a, _b, _c, _d;
        if (this.running)
            return;
        // ✅ define from opts (with defaults)
        const width = (_a = this.opts.width) !== null && _a !== void 0 ? _a : 1280;
        const height = (_b = this.opts.height) !== null && _b !== void 0 ? _b : 720;
        const fps = (_c = this.opts.fps) !== null && _c !== void 0 ? _c : 10;
        const quality = (_d = this.opts.quality) !== null && _d !== void 0 ? _d : 6;
        const args = this.buildArgs(width, height, fps, quality);
        // more verbose logs while debugging
        args.unshift("-hide_banner", "-loglevel", "info");
        this.proc = (0, child_process_1.spawn)("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
        // Read MJPEG bytes from stdout and split frames by JPEG SOI/EOI
        this.proc.stdout.on("data", (chunk) => {
            this.buffer = Buffer.concat([this.buffer, chunk]);
            // SOI = 0xFF 0xD8, EOI = 0xFF 0xD9
            const SOI = 0xffd8, EOI = 0xffd9;
            // naive scan (good enough for MJPEG over pipe)
            for (;;) {
                let i = 0, start = -1, end = -1;
                // find SOI
                for (; i + 1 < this.buffer.length; i++) {
                    const marker = (this.buffer[i] << 8) | this.buffer[i + 1];
                    if (marker === SOI) {
                        start = i;
                        break;
                    }
                }
                if (start < 0)
                    break;
                // find EOI after SOI
                i = start + 2;
                for (; i + 1 < this.buffer.length; i++) {
                    const marker = (this.buffer[i] << 8) | this.buffer[i + 1];
                    if (marker === EOI) {
                        end = i + 2;
                        break;
                    }
                }
                if (end < 0)
                    break;
                const jpeg = this.buffer.slice(start, end);
                this.buffer = this.buffer.slice(end);
                onFrame(jpeg, { ts: Date.now(), w: width, h: height });
            }
        });
        this.proc.stderr.setEncoding("utf8");
        this.proc.stderr.on("data", (chunk) => {
            var _a, _b;
            const line = chunk.trim();
            if (!line)
                return;
            if (line.toLowerCase().includes("error"))
                (_a = this.onError) === null || _a === void 0 ? void 0 : _a.call(this, line);
            else
                (_b = this.onLog) === null || _b === void 0 ? void 0 : _b.call(this, line);
        });
        this.proc.on("spawn", () => { var _a; return (_a = this.onStart) === null || _a === void 0 ? void 0 : _a.call(this); });
        this.proc.on("exit", (code) => { var _a; (_a = this.onStop) === null || _a === void 0 ? void 0 : _a.call(this, code !== null && code !== void 0 ? code : null); this.proc = null; this.buffer = Buffer.alloc(0); });
        this.proc.on("error", () => { this.proc = null; this.buffer = Buffer.alloc(0); });
    }
    stop() {
        if (!this.proc)
            return;
        try {
            this.proc.kill("SIGTERM");
        }
        catch (_a) { }
        this.proc = null;
        this.buffer = Buffer.alloc(0);
    }
    buildArgs(w, h, fps, q) {
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
exports.MjpegStreamer = MjpegStreamer;
