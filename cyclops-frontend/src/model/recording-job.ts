export type RecordingJobStatus = 'PENDING' | 'RECORDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface RecordingJob {
  _id: string;
  recordingId: string;
  locationId: string;
  userId?: string;
  startTimeMs: number;
  durationMinutes: number;
  status: RecordingJobStatus;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

