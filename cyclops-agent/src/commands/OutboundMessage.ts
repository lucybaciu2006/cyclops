// Outbound messages sent by the agent to the server

import { TelemetryData } from "../model/TelemetryData";

export type OutboundMessage =
  | HelloMessage
  | HeartbeatMessage
  | PreviewStatus
  | PreviewLog
  | PreviewError
  | RecordingAck
  | RecordingNack
  | RecordingLog
  | RecordingError
  | RecordingEvent
  | RecordingDone;

export interface HelloMessage {
  type: 'hello';
  agentId: string;
  version: string;
}

export interface HeartbeatMessage {
  type: 'heartbeat';
  ts: string;
  metrics: {
    uptimeSec: number;
    loadAvg?: number[] | null;
    freeMem: number;
    totalMem: number;
    recording: boolean;
    recordingId?: string | null;
    preview: boolean;
  };
  telemetry: TelemetryData;
}

export interface PreviewStatus { type: 'preview-status'; status: 'started' | 'stopped'; code?: number; }
export interface PreviewLog { type: 'preview-log'; line: string; }
export interface PreviewError { type: 'preview-error'; line?: string; message?: string; }

export interface RecordingAck { type: 'recording-ack'; status: string; recordingId?: string | null; reason?: string; bucket?: string; GCS_BUCKET?: string; gcsPrefix?: string; }
export interface RecordingNack { type: 'recording-nack'; error: string; recordingId?: string | null; }
export interface RecordingLog { type: 'recording-log'; recordingId?: string | null; line: string; }
export interface RecordingError { type: 'recording-error'; recordingId?: string | null; line: string; }
export interface RecordingEvent { type: 'recording-event'; recordingId?: string | null; [k: string]: unknown; }
export interface RecordingDone { type: 'recording-done'; recordingId?: string | null; reason: 'auto' | 'manual' | 'error'; }

