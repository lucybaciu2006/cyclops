"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.FfmpegRecorder = void 0;
const child_process_1 = require("child_process");
const os_1 = __importDefault(require("os"));
class FfmpegRecorder {
    constructor() {
        this.platform = os_1.default.platform();
        this.proc = null;
        this.state = 'idle';
    }
    get status() { return this.state; }
    start(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            if (this.proc || this.state !== 'idle') {
                (_a = this.onError) === null || _a === void 0 ? void 0 : _a.call(this, '[ffrec] start() called but recorder is not idle.');
                return;
            }
            // Defaults
            this.opts = {
                outputPath: options.outputPath,
                device: options.device,
                useLastDevice: (_b = options.useLastDevice) !== null && _b !== void 0 ? _b : false,
                width: (_c = options.width) !== null && _c !== void 0 ? _c : 1280,
                height: (_d = options.height) !== null && _d !== void 0 ? _d : 720,
                fps: (_e = options.fps) !== null && _e !== void 0 ? _e : 25,
                crf: (_f = options.crf) !== null && _f !== void 0 ? _f : 22,
                preset: (_g = options.preset) !== null && _g !== void 0 ? _g : 'veryfast',
                inputFormatLinux: options.inputFormatLinux,
            };
            const device = (_h = this.opts.device) !== null && _h !== void 0 ? _h : yield this.resolveDevice();
            (_j = this.onLog) === null || _j === void 0 ? void 0 : _j.call(this, `[ffrec] using device: ${device}`);
            const args = this.buildArgs(device, this.opts.outputPath);
            (_k = this.onLog) === null || _k === void 0 ? void 0 : _k.call(this, `[ffrec] ffmpeg ${args.map(a => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`);
            this.proc = (0, child_process_1.spawn)('ffmpeg', ['-hide_banner', '-loglevel', 'info', ...args], { stdio: ['pipe', 'ignore', 'pipe'] });
            this.state = 'recording';
            try {
                (_l = this.onStart) === null || _l === void 0 ? void 0 : _l.call(this);
            }
            catch (_p) { }
            (_m = this.proc.stderr) === null || _m === void 0 ? void 0 : _m.setEncoding('utf8');
            (_o = this.proc.stderr) === null || _o === void 0 ? void 0 : _o.on('data', (d) => {
                var _a, _b;
                const line = d.trim();
                if (!line)
                    return;
                if (line.toLowerCase().includes('error'))
                    (_a = this.onError) === null || _a === void 0 ? void 0 : _a.call(this, line);
                else
                    (_b = this.onLog) === null || _b === void 0 ? void 0 : _b.call(this, line);
            });
            this.proc.on('exit', () => {
                var _a;
                this.proc = null;
                this.state = 'idle';
                try {
                    (_a = this.onStop) === null || _a === void 0 ? void 0 : _a.call(this);
                }
                catch (_b) { }
            });
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.state !== 'recording' && this.state !== 'stopping')
                return;
            this.state = 'stopping';
            try {
                (_b = (_a = this.proc) === null || _a === void 0 ? void 0 : _a.stdin) === null || _b === void 0 ? void 0 : _b.write('q');
            }
            catch (_c) { }
            yield new Promise((resolve) => {
                if (!this.proc)
                    return resolve();
                this.proc.once('exit', () => resolve());
            });
        });
    }
    // ---------- internals ----------
    resolveDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if ((_a = this.opts) === null || _a === void 0 ? void 0 : _a.useLastDevice) {
                if (this.platform === 'linux') {
                    // prefer highest /dev/videoN
                    try {
                        const fs = yield Promise.resolve().then(() => __importStar(require('fs')));
                        const list = fs.readdirSync('/dev')
                            .filter(n => n.startsWith('video'))
                            .map(n => `/dev/${n}`)
                            .sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')));
                        return list[list.length - 1] || '/dev/video0';
                    }
                    catch ( /* ignore */_c) { /* ignore */ }
                }
                if (this.platform === 'win32') {
                    const out = yield this.runFF(['-hide_banner', '-f', 'dshow', '-list_devices', 'true', '-i', 'dummy']);
                    const names = Array.from(out.matchAll(/"(.+?)"\s+\(video\)/g)).map(m => m[1]);
                    return names[names.length - 1] || 'Integrated Camera';
                }
                // darwin
                const out = yield this.runFF(['-hide_banner', '-f', 'avfoundation', '-list_devices', 'true', '-i', '']);
                const idxs = Array.from(out.matchAll(/\[(\d+)\]\s+.+?\s+\(video\)/g)).map(m => m[1]);
                return ((_b = idxs[idxs.length - 1]) !== null && _b !== void 0 ? _b : '0');
            }
            if (this.platform === 'linux')
                return '/dev/video0';
            if (this.platform === 'win32')
                return 'Integrated Camera';
            return '0';
        });
    }
    buildArgs(device, outPath) {
        if (!this.opts)
            throw new Error('not started');
        const w = this.opts.width, h = this.opts.height, fps = this.opts.fps;
        const crf = this.opts.crf, preset = this.opts.preset;
        if (this.platform === 'linux') {
            const args = [
                '-f', 'v4l2',
                '-framerate', String(fps),
                '-video_size', `${w}x${h}`,
            ];
            if (this.opts.inputFormatLinux)
                args.push('-input_format', this.opts.inputFormatLinux);
            args.push('-i', device, '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-g', String(fps * 2), '-sc_threshold', '0', outPath);
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
    runFF(args) {
        return new Promise((resolve) => {
            const p = (0, child_process_1.spawn)('ffmpeg', args);
            let s = '';
            p.stderr.setEncoding('utf8');
            p.stderr.on('data', (d) => (s += d));
            p.on('close', () => resolve(s));
            p.on('error', () => resolve(s));
        });
    }
}
exports.FfmpegRecorder = FfmpegRecorder;
