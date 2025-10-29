export enum RecordingSessionStatus {
    ARMED = 'ARMED',
    RECORDING = 'RECORDING',
    POST_PROCESSING = 'POST_PROCESSING',
    COMPLETED = 'COMPLETED'
}

export interface RecordingSession {
    _id: string;
    userId: string;
    locationId: string;
    dayKey: string;      // YYYY-MM-DD
    slotIndex: number;   // start slot index (0..47 for 30-min)
    slotDuration: number;// minutes per slot
    duration: number;    // number of slots
    views: number;
    status: RecordingSessionStatus;
    metadata?: any;
}

