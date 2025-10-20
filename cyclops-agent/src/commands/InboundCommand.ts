// Inbound commands accepted by the agent over WebSocket

export type InboundCommand =
  | StartPreviewCommand
  | StopPreviewCommand
  | StartRecordingCommand
  | StopRecordingCommand
  // Legacy non-command variants for backwards compatibility
  | LegacyStartRecording
  | LegacyStopRecording;

export interface CommandEnvelope<T extends string, P = unknown> {
  type: 'command';
  cmd: T;
  // payload fields are flattened at top-level for convenience, but we keep typing generic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
}

export type StartPreviewCommand = CommandEnvelope<'startPreview'> & {
  fps?: number;
  quality?: number;
};

export type StopPreviewCommand = CommandEnvelope<'stopPreview'>;

export type StartRecordingCommand = CommandEnvelope<'startRecording'> & {
  recordingId?: string;
  locationId?: string;
  durationMinutes?: number;
  bucket?: string;
  segmentSeconds?: number;
  useLastDevice?: boolean;
  width?: number;
  height?: number;
  fps?: number;
  inputFormatLinux?: string;
  crf?: number;
  preset?: string;
  maxConcurrentUploads?: number;
  metadata?: Record<string, unknown>;
};

export type StopRecordingCommand = CommandEnvelope<'stopRecording'>;

// Legacy non-command variants
export interface LegacyStartRecording {
  type: 'START_RECORDING';
  recordingId?: string;
  durationMinutes?: number;
  // other fields same as StartRecordingCommand
  [k: string]: unknown;
}

export interface LegacyStopRecording {
  type: 'END_RECORDING';
}

