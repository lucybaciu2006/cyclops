import WebSocket from 'ws';
import os from 'os';
import { UsbCameraController } from "./camera/UsbCameraController";
import { MjpegStreamer } from "./camera/MjpegStreamer";
import {SegmentRecorderUploader} from "./upload/SegmentRecorderUploader";

const SERVER_URL = 'ws://localhost:3000/agents';
const API_KEY = 'SECRET_API_KEY';
const AGENT_ID = 'HP_EliteDesk';
const LOCATION_ID = '6895eef8ab6ecd1201d71372';
const GCS_BUCKET = 'cyclops-videos'; // <-- must be set in env for recording

let preview: MjpegStreamer | null = null;

// Recording state
let recorder: SegmentRecorderUploader | null = null;
let currentRecordingId: string | null = null;
let autoStopTimer: NodeJS.Timeout | null = null;

UsbCameraController.listVideoDevices().then(devices => {
    console.log("Video devices:", devices);
});

let ws: WebSocket | null = null;
let reconnectDelayMs = 1000; // start with 1s, exponential backoff to 30s
let heartbeatTimer: NodeJS.Timeout | null = null;

function sendBinary(buf: Buffer) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(buf);
}

function sendJson(json: any) {
    try {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(json));
        }
    } catch {
        // ignore
    }
}

function startHeartbeat() {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
        sendJson({
            type: 'heartbeat',
            ts: new Date().toISOString(),
            metrics: {
                uptimeSec: Math.floor(process.uptime()),
                loadAvg: os.loadavg(),
                freeMem: os.freemem(),
                totalMem: os.totalmem(),
                // optional: include recorder/preview state
                recording: !!recorder && recorder.status !== "idle",
                recordingId: currentRecordingId,
                preview: !!preview && preview.running,
            },
        });
    }, 15000);
}

function stopHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
}

function scheduleReconnect() {
    stopHeartbeat();
    const delay = Math.min(reconnectDelayMs, 30000);
    console.log(`[agent] reconnecting in ${Math.floor(delay / 1000)}s...`);
    setTimeout(connect, delay);
    reconnectDelayMs = Math.min(delay * 2, 30000);
}

// ---------- Preview helpers ----------

function startPreview(fps?: number, quality?: number) {
    // If recording is active, refuse preview (camera cannot be shared)
    if (recorder && recorder.status !== "idle") {
        sendJson({ type: "preview-error", message: "Camera is busy (recording in progress)" });
        return;
    }

    if (!preview) preview = new MjpegStreamer({ fps: fps ?? 10, quality: quality ?? 6 });

    preview.onLog   = (line) => sendJson({ type: "preview-log", line });
    preview.onError = (line) => sendJson({ type: "preview-error", line });
    preview.onStart = () => sendJson({ type: "preview-status", status: "started" });
    preview.onStop  = (code) => sendJson({ type: "preview-status", status: "stopped", code });

    if (!preview.running) {
        console.log('starting the preview');
        preview.start((jpeg, meta) => {
            const header = Buffer.alloc(4 + 8 + 2 + 2);
            header.write("MJPG", 0, 4, "ascii");
            header.writeBigUInt64BE(BigInt(meta.ts), 4);
            header.writeUInt16BE(meta.w, 12);
            header.writeUInt16BE(meta.h, 14);
            sendBinary(Buffer.concat([header, jpeg]));
        });
    }
    sendJson({ type: "preview-status", status: "started" });
}

function stopPreview() {
    preview?.stop();
    preview = null;
    sendJson({ type: "preview-status", status: "stopped" });
}

// ---------- Recording helpers ----------

async function startRecording(payload: any) {
    if (recorder && recorder.status !== "idle") {
        // idempotent if same recordingId
        if (payload?.recordingId && payload.recordingId === currentRecordingId) {
            sendJson({ type: "recording-ack", status: "already-recording", recordingId: currentRecordingId });
        } else {
            sendJson({ type: "recording-nack", error: "already recording", recordingId: currentRecordingId });
        }
        return;
    }

    if (!GCS_BUCKET && !payload?.bucket) {
        console.error('Missing GCS bucket');
        sendJson({ type: "recording-nack", error: "Missing GCS bucket (set env GCS_BUCKET or pass payload.bucket)" });
        return;
    }

    const recordingId = payload?.recordingId || `${AGENT_ID}-${Date.now()}`;
    const locationId = payload?.locationId || LOCATION_ID;
    const durationMinutes = payload.durationMinutes;

    // If preview is running, stop it so the camera is free
    if (preview?.running) {
        console.log("[rec] stopping preview to start recording");
        stopPreview();
    }

    recorder = new SegmentRecorderUploader();
    currentRecordingId = recordingId;

    const gcsPrefix = `videos/full/${new Date().getTime()}`;

    // bubble recorder events/logs back to server
    recorder.onEvent = (e)  => sendJson({ type: "recording-event", recordingId, ...e });
    recorder.onLog   = (l)  => sendJson({ type: "recording-log",   recordingId, line: l });
    recorder.onError = (l)  => sendJson({ type: "recording-error", recordingId, line: l });

    try {
        console.log('trying to start');
        await recorder.start({
            // storage
            bucket: GCS_BUCKET!,
            gcsPrefix,
            recordingId,

            // local segment spool
            outputDir: "D:\\cyclops",
            segmentSeconds: Number(payload?.segmentSeconds ?? process.env.SEGMENT_SECONDS ?? 60),

            // device & capture
            device: 'Trust USB Camera', // linux: /dev/videoX, win: friendly name, mac: "0"
            useLastDevice: payload?.useLastDevice ?? (process.env.CAM_USE_LAST === "1"),
            width: Number(payload?.width ?? process.env.CAM_WIDTH ?? 1280),
            height: Number(payload?.height ?? process.env.CAM_HEIGHT ?? 720),
            fps: Number(payload?.fps ?? process.env.CAM_FPS ?? 25),
            inputFormatLinux: payload?.inputFormatLinux || (process.env.CAM_INPUT_FORMAT as any), // e.g. "mjpeg"

            // encode
            crf: Number(payload?.crf ?? process.env.CAM_CRF ?? 22),
            preset: (payload?.preset || process.env.CAM_PRESET || "veryfast") as any,

            // upload
            maxConcurrentUploads: Number(payload?.maxConcurrentUploads ?? process.env.MAX_CONCURRENT_UPLOADS ?? 2),

            // metadata
            metadata: {
                locationId,
                agentId: AGENT_ID,
                ...(payload?.metadata || {})
            },
        });

        // auto-stop timer (durationSec)
        if (autoStopTimer) { clearTimeout(autoStopTimer); autoStopTimer = null; }
        if (durationMinutes > 0) {
            autoStopTimer = setTimeout(async () => {
                if (!recorder) return;
                try {
                    await recorder.stop(); // drains uploads
                    sendJson({ type: "recording-done", recordingId, reason: "auto" });
                } finally {
                    recorder = null;
                    currentRecordingId = null;
                }
            }, durationMinutes * 1000 * 60);
        }

        sendJson({ type: "recording-ack", status: recorder.status, recordingId, GCS_BUCKET, gcsPrefix });
    } catch (e: any) {
        console.error(e);
        sendJson({ type: "recording-nack", error: e?.message || String(e) });
        recorder = null;
        currentRecordingId = null;
    }
}

async function stopRecording(reason: "manual" | "auto" | "error" = "manual") {
    if (!recorder) {
        sendJson({ type: "recording-ack", status: "idle", recordingId: currentRecordingId, reason });
        return;
    }
    try {
        if (autoStopTimer) { clearTimeout(autoStopTimer); autoStopTimer = null; }
        await recorder.stop(); // waits for queue to drain
        sendJson({ type: "recording-ack", status: "idle", recordingId: currentRecordingId, reason });
    } catch (e: any) {
        sendJson({ type: "recording-nack", error: e?.message || String(e), recordingId: currentRecordingId });
    } finally {
        recorder = null;
        currentRecordingId = null;
    }
}

// ---------- WS connect/dispatch ----------

function connect() {
    try {
        console.log(`[agent] connecting to ${SERVER_URL} as ${AGENT_ID}`);
        ws = new WebSocket(SERVER_URL, {
            headers: {
                'User-Agent': 'node-agent/1.0',
                'x-location-id': LOCATION_ID,
                'x-api-key': API_KEY
            }
        });

        ws.on('open', () => {
            console.log('[agent] connected');
            reconnectDelayMs = 1000; // reset backoff on success
            sendJson({ type: 'hello', agentId: AGENT_ID, version: '1.0.0' });
            startHeartbeat();
        });

        // respond to pings from server
        ws.on('ping', () => {
            try { ws?.pong(); } catch {}
        });

        ws.on('message', async (data) => {
            try {
                const msg = JSON.parse(data.toString());
                console.log('MSG RECEIVED:', msg);

                // Unified "command" style (as you use for preview)
                if (msg.type === "command") {
                    switch (msg.cmd) {
                        case "startPreview":
                            startPreview(msg.fps, msg.quality);
                            return;
                        case "stopPreview":
                            stopPreview();
                            return;
                        case "startRecording":
                            await startRecording(msg);
                            return;
                        case "stopRecording":
                            await stopRecording("manual");
                            return;
                    }
                }

                // (Optional) also accept non-command variants if you ever send them:
                if (msg.type === "START_RECORDING") { await startRecording(msg); return; }
                if (msg.type === "END_RECORDING")   { await stopRecording("manual"); return; }
            } catch {
                // ignore non-JSON
            }
        });

        ws.on('close', (code, reason) => {
            console.log(`[agent] connection closed (${code}) ${reason.toString()}`);
            scheduleReconnect();
        });

        ws.on('error', (err) => {
            console.error(err);
            console.error('[agent] socket error:', err.message);
            try { ws?.close(); } catch {}
            if (ws && ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
                scheduleReconnect();
            }
        });
    } catch (e) {
        console.error('[agent] connect error:', (e as Error).message);
        scheduleReconnect();
    }
}

connect();
