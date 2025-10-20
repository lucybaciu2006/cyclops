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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketCommandHandler = void 0;
const MjpegStreamer_1 = require("../camera/MjpegStreamer");
const SegmentRecorderUploader_1 = require("../upload/SegmentRecorderUploader");
class WebSocketCommandHandler {
    constructor(deps) {
        this.deps = deps;
        this.preview = null;
        this.recorder = null;
        this.currentRecordingId = null;
        this.autoStopTimer = null;
    }
    getAgentState() {
        return {
            recording: !!this.recorder && this.recorder.status !== 'idle',
            recordingId: this.currentRecordingId,
            preview: !!this.preview && !!this.preview.running,
        };
    }
    handle(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            // graceful JSON-like dynamic shape support
            const anyMsg = msg;
            if (!anyMsg)
                return;
            // Unified command style
            if (anyMsg.type === 'command') {
                const cmd = anyMsg.cmd;
                switch (cmd) {
                    case 'startPreview':
                        this.startPreview(anyMsg.fps, anyMsg.quality);
                        return;
                    case 'stopPreview':
                        this.stopPreview();
                        return;
                    case 'startRecording':
                        yield this.startRecording(anyMsg);
                        return;
                    case 'stopRecording':
                        yield this.stopRecording('manual');
                        return;
                }
            }
            // Backwards-compatible variants
            if (anyMsg.type === 'START_RECORDING') {
                yield this.startRecording(anyMsg);
                return;
            }
            if (anyMsg.type === 'END_RECORDING') {
                yield this.stopRecording('manual');
                return;
            }
        });
    }
    // ---------- Preview helpers ----------
    startPreview(fps, quality) {
        if (this.recorder && this.recorder.status !== 'idle') {
            this.deps.sendJson({ type: 'preview-error', message: 'Camera is busy (recording in progress)' });
            return;
        }
        if (!this.preview)
            this.preview = new MjpegStreamer_1.MjpegStreamer({ fps: fps !== null && fps !== void 0 ? fps : 10, quality: quality !== null && quality !== void 0 ? quality : 6 });
        this.preview.onLog = (line) => this.deps.sendJson({ type: 'preview-log', line });
        this.preview.onError = (line) => this.deps.sendJson({ type: 'preview-error', line });
        this.preview.onStart = () => this.deps.sendJson({ type: 'preview-status', status: 'started' });
        this.preview.onStop = (code) => this.deps.sendJson({ type: 'preview-status', status: 'stopped', code });
        if (!this.preview.running) {
            this.preview.start((jpeg, meta) => {
                const header = Buffer.alloc(4 + 8 + 2 + 2);
                header.write('MJPG', 0, 4, 'ascii');
                header.writeBigUInt64BE(BigInt(meta.ts), 4);
                header.writeUInt16BE(meta.w, 12);
                header.writeUInt16BE(meta.h, 14);
                this.deps.sendBinary(Buffer.concat([header, jpeg]));
            });
        }
        this.deps.sendJson({ type: 'preview-status', status: 'started' });
    }
    stopPreview() {
        var _a;
        (_a = this.preview) === null || _a === void 0 ? void 0 : _a.stop();
        this.preview = null;
        this.deps.sendJson({ type: 'preview-status', status: 'stopped' });
    }
    // ---------- Recording helpers ----------
    startRecording(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            if (this.recorder && this.recorder.status !== 'idle') {
                if ((payload === null || payload === void 0 ? void 0 : payload.recordingId) && payload.recordingId === this.currentRecordingId) {
                    this.deps.sendJson({ type: 'recording-ack', status: 'already-recording', recordingId: this.currentRecordingId });
                }
                else {
                    this.deps.sendJson({ type: 'recording-nack', error: 'already recording', recordingId: this.currentRecordingId });
                }
                return;
            }
            const bucket = (payload === null || payload === void 0 ? void 0 : payload.bucket) || this.deps.gcsBucket;
            if (!bucket) {
                this.deps.sendJson({ type: 'recording-nack', error: 'Missing GCS bucket (set env GCS_BUCKET or pass payload.bucket)' });
                return;
            }
            const recordingId = (payload === null || payload === void 0 ? void 0 : payload.recordingId) || `${this.deps.agentId}-${Date.now()}`;
            const locationId = (payload === null || payload === void 0 ? void 0 : payload.locationId) || this.deps.locationId;
            const durationMinutes = payload === null || payload === void 0 ? void 0 : payload.durationMinutes;
            // If preview is running, stop it so the camera is free
            if ((_a = this.preview) === null || _a === void 0 ? void 0 : _a.running)
                this.stopPreview();
            this.recorder = new SegmentRecorderUploader_1.SegmentRecorderUploader();
            this.currentRecordingId = recordingId;
            const gcsPrefix = `videos/full/${Date.now()}`;
            // bubble recorder events/logs back to server
            this.recorder.onEvent = (e) => this.deps.sendJson({
                type: 'recording-event',
                recordingId,
                eventType: e.type,
                at: e.at,
                localPath: e.localPath,
                gcsKey: e.gcsKey,
                error: e.error,
            });
            this.recorder.onLog = (l) => this.deps.sendJson({ type: 'recording-log', recordingId, line: l });
            this.recorder.onError = (l) => this.deps.sendJson({ type: 'recording-error', recordingId, line: l });
            try {
                yield this.recorder.start({
                    bucket,
                    gcsPrefix,
                    recordingId,
                    // local segment spool (keep same as existing)
                    outputDir: 'D:\\cyclops',
                    // note: single-file MVP; segmentSeconds is ignored
                    // device & capture
                    device: 'Trust USB Camera',
                    useLastDevice: (_b = payload === null || payload === void 0 ? void 0 : payload.useLastDevice) !== null && _b !== void 0 ? _b : (process.env.CAM_USE_LAST === '1'),
                    width: Number((_d = (_c = payload === null || payload === void 0 ? void 0 : payload.width) !== null && _c !== void 0 ? _c : process.env.CAM_WIDTH) !== null && _d !== void 0 ? _d : 1280),
                    height: Number((_f = (_e = payload === null || payload === void 0 ? void 0 : payload.height) !== null && _e !== void 0 ? _e : process.env.CAM_HEIGHT) !== null && _f !== void 0 ? _f : 720),
                    fps: Number((_h = (_g = payload === null || payload === void 0 ? void 0 : payload.fps) !== null && _g !== void 0 ? _g : process.env.CAM_FPS) !== null && _h !== void 0 ? _h : 25),
                    inputFormatLinux: (payload === null || payload === void 0 ? void 0 : payload.inputFormatLinux) || process.env.CAM_INPUT_FORMAT,
                    // encode
                    crf: Number((_k = (_j = payload === null || payload === void 0 ? void 0 : payload.crf) !== null && _j !== void 0 ? _j : process.env.CAM_CRF) !== null && _k !== void 0 ? _k : 22),
                    preset: ((payload === null || payload === void 0 ? void 0 : payload.preset) || process.env.CAM_PRESET || 'veryfast'),
                    // metadata
                    metadata: Object.assign({ locationId, agentId: this.deps.agentId }, ((payload === null || payload === void 0 ? void 0 : payload.metadata) || {})),
                });
                // auto-stop timer (durationSec)
                if (this.autoStopTimer) {
                    clearTimeout(this.autoStopTimer);
                    this.autoStopTimer = null;
                }
                if (durationMinutes > 0) {
                    this.autoStopTimer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        if (!this.recorder)
                            return;
                        try {
                            yield this.recorder.stop();
                            this.deps.sendJson({ type: 'recording-done', recordingId, reason: 'auto' });
                        }
                        finally {
                            this.recorder = null;
                            this.currentRecordingId = null;
                        }
                    }), durationMinutes * 1000 * 60);
                }
                this.deps.sendJson({ type: 'recording-ack', status: this.recorder.status, recordingId, bucket, gcsPrefix });
            }
            catch (e) {
                this.deps.sendJson({ type: 'recording-nack', error: (e === null || e === void 0 ? void 0 : e.message) || String(e) });
                this.recorder = null;
                this.currentRecordingId = null;
            }
        });
    }
    stopRecording() {
        return __awaiter(this, arguments, void 0, function* (reason = 'manual') {
            if (!this.recorder) {
                this.deps.sendJson({ type: 'recording-ack', status: 'idle', recordingId: this.currentRecordingId, reason });
                return;
            }
            try {
                if (this.autoStopTimer) {
                    clearTimeout(this.autoStopTimer);
                    this.autoStopTimer = null;
                }
                yield this.recorder.stop();
                this.deps.sendJson({ type: 'recording-ack', status: 'idle', recordingId: this.currentRecordingId, reason });
            }
            catch (e) {
                this.deps.sendJson({ type: 'recording-nack', error: (e === null || e === void 0 ? void 0 : e.message) || String(e), recordingId: this.currentRecordingId });
            }
            finally {
                this.recorder = null;
                this.currentRecordingId = null;
            }
        });
    }
}
exports.WebSocketCommandHandler = WebSocketCommandHandler;
