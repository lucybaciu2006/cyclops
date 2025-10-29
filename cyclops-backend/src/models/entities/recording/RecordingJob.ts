import mongoose, { Document, Schema } from 'mongoose';

export enum RecordingJobStatus {
  PENDING = 'PENDING',
  RECORDING = 'RECORDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface IRecordingJob extends Document {
  recordingId: string;       // unique id used between backend and agent
  locationId: string;
  userId?: string;
  startTimeMs: number;       // epoch ms
  durationMinutes: number;   // planned duration
  status: RecordingJobStatus;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const RecordingJobSchema = new Schema<IRecordingJob>({
  recordingId: { type: String, required: true, unique: true, index: true },
  locationId: { type: String, required: true, index: true },
  userId: { type: String, required: false },
  startTimeMs: { type: Number, required: true },
  durationMinutes: { type: Number, required: true, min: 1 },
  status: { type: String, required: true, enum: Object.values(RecordingJobStatus), default: RecordingJobStatus.PENDING },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const RecordingJob = mongoose.model<IRecordingJob>('RecordingJob', RecordingJobSchema);
