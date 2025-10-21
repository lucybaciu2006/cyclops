import { MjpegStreamer } from "../camera/MjpegStreamer";
import { SegmentRecorderUploader } from "../upload/SegmentRecorderUploader";
import { InboundCommand } from "../commands/InboundCommand";
import { AgentStateTelemetry } from "../model/TelemetryData";

export interface CommandHandlerDeps {
  sendJson: (json: unknown) => void;
  sendBinary: (buf: Buffer) => void;
  agentId: string;
  locationId: string;
  gcsBucket: string;
}

export class WebSocketCommandHandler {
  private preview: MjpegStreamer | null = null;
  private recorder: SegmentRecorderUploader | null = null;
  private currentRecordingId: string | null = null;
  private autoStopTimer: NodeJS.Timeout | null = null;

  constructor(private deps: CommandHandlerDeps) {}

  getAgentState(): AgentStateTelemetry {
    return {
      recording: !!this.recorder && this.recorder.status !== 'idle',
      recordingId: this.currentRecordingId,
      preview: !!this.preview && !!this.preview.running,
    };
  }

  async handle(msg: unknown): Promise<void> {
    // graceful JSON-like dynamic shape support
    const anyMsg = msg as any;
    if (!anyMsg) return;

    // Unified command style
    if (anyMsg.type === 'command') {
      const cmd: string = anyMsg.cmd;
      switch (cmd) {
        case 'startPreview':
          this.startPreview(anyMsg.fps, anyMsg.quality);
          return;
        case 'stopPreview':
          this.stopPreview();
          return;
        case 'startRecording':
          await this.startRecording(anyMsg);
          return;
        case 'stopRecording':
          await this.stopRecording('manual');
          return;
      }
    }

    // Backwards-compatible variants
    if (anyMsg.type === 'START_RECORDING') { await this.startRecording(anyMsg); return; }
    if (anyMsg.type === 'END_RECORDING') { await this.stopRecording('manual'); return; }
  }

  // ---------- Preview helpers ----------
  private startPreview(fps?: number, quality?: number) {
    if (this.recorder && this.recorder.status !== 'idle') {
      this.deps.sendJson({ type: 'preview-error', message: 'Camera is busy (recording in progress)' });
      return;
    }

    if (!this.preview) this.preview = new MjpegStreamer({ fps: fps ?? 10, quality: quality ?? 6, inputUrl: process.env.CAM_INPUT_URL });

    this.preview.onLog   = (line) => this.deps.sendJson({ type: 'preview-log', line });
    this.preview.onError = (line) => this.deps.sendJson({ type: 'preview-error', line });
    this.preview.onStart = () => this.deps.sendJson({ type: 'preview-status', status: 'started' });
    this.preview.onStop  = (code) => this.deps.sendJson({ type: 'preview-status', status: 'stopped', code });

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

  private stopPreview() {
    this.preview?.stop();
    this.preview = null;
    this.deps.sendJson({ type: 'preview-status', status: 'stopped' });
  }

  // ---------- Recording helpers ----------
  private async startRecording(payload: any) {
    if (this.recorder && this.recorder.status !== 'idle') {
      if (payload?.recordingId && payload.recordingId === this.currentRecordingId) {
        this.deps.sendJson({ type: 'recording-ack', status: 'already-recording', recordingId: this.currentRecordingId });
      } else {
        this.deps.sendJson({ type: 'recording-nack', error: 'already recording', recordingId: this.currentRecordingId });
      }
      return;
    }

    const bucket = payload?.bucket || this.deps.gcsBucket;
    if (!bucket) {
      this.deps.sendJson({ type: 'recording-nack', error: 'Missing GCS bucket (set env GCS_BUCKET or pass payload.bucket)' });
      return;
    }

    const recordingId = payload?.recordingId || `${this.deps.agentId}-${Date.now()}`;
    const locationId = payload?.locationId || this.deps.locationId;
    const durationMinutes = payload?.durationMinutes;

    // If preview is running, stop it so the camera is free
    if (this.preview?.running) this.stopPreview();

    this.recorder = new SegmentRecorderUploader();
    this.currentRecordingId = recordingId;

    const gcsPrefix = `videos/full/${Date.now()}`;

    // bubble recorder events/logs back to server
    this.recorder.onEvent = (e)  => this.deps.sendJson({
      type: 'recording-event',
      recordingId,
      eventType: e.type,
      at: e.at,
      localPath: e.localPath,
      gcsKey: e.gcsKey,
      error: e.error,
    });
    this.recorder.onLog   = (l)  => this.deps.sendJson({ type: 'recording-log',   recordingId, line: l });
    this.recorder.onError = (l)  => this.deps.sendJson({ type: 'recording-error', recordingId, line: l });

    try {
      await this.recorder.start({
        bucket,
        gcsPrefix,
        recordingId,

        // local segment spool (keep same as existing)
        outputDir: 'D:\\cyclops',
        // note: single-file MVP; segmentSeconds is ignored

        // device & capture
        device: 'Trust USB Camera',
        useLastDevice: payload?.useLastDevice ?? (process.env.CAM_USE_LAST === '1'),
        width: Number(payload?.width ?? process.env.CAM_WIDTH ?? 1280),
        height: Number(payload?.height ?? process.env.CAM_HEIGHT ?? 720),
        fps: Number(payload?.fps ?? process.env.CAM_FPS ?? 25),
        inputFormatLinux: payload?.inputFormatLinux || (process.env.CAM_INPUT_FORMAT as any),

        // encode
        crf: Number(payload?.crf ?? process.env.CAM_CRF ?? 22),
        preset: (payload?.preset || process.env.CAM_PRESET || 'veryfast') as any,

        // metadata
        metadata: {
          locationId,
          agentId: this.deps.agentId,
          ...(payload?.metadata || {}),
        },
      });

      // auto-stop timer (durationSec)
      if (this.autoStopTimer) { clearTimeout(this.autoStopTimer); this.autoStopTimer = null; }
      if (durationMinutes > 0) {
        this.autoStopTimer = setTimeout(async () => {
          if (!this.recorder) return;
          try {
            await this.recorder.stop();
            this.deps.sendJson({ type: 'recording-done', recordingId, reason: 'auto' });
          } finally {
            this.recorder = null;
            this.currentRecordingId = null;
          }
        }, durationMinutes * 1000 * 60);
      }

      this.deps.sendJson({ type: 'recording-ack', status: this.recorder.status, recordingId, bucket, gcsPrefix });
    } catch (e: any) {
      this.deps.sendJson({ type: 'recording-nack', error: e?.message || String(e) });
      this.recorder = null;
      this.currentRecordingId = null;
    }
  }

  async stopRecording(reason: 'manual' | 'auto' | 'error' = 'manual') {
    if (!this.recorder) {
      this.deps.sendJson({ type: 'recording-ack', status: 'idle', recordingId: this.currentRecordingId, reason });
      return;
    }
    try {
      if (this.autoStopTimer) { clearTimeout(this.autoStopTimer); this.autoStopTimer = null; }
      await this.recorder.stop();
      this.deps.sendJson({ type: 'recording-ack', status: 'idle', recordingId: this.currentRecordingId, reason });
    } catch (e: any) {
      this.deps.sendJson({ type: 'recording-nack', error: e?.message || String(e), recordingId: this.currentRecordingId });
    } finally {
      this.recorder = null;
      this.currentRecordingId = null;
    }
  }
}
