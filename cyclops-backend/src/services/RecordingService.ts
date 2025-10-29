import { RecordingSessionModel, RecordingSessionStatus, IRecordingSessionDoc } from '../models/entities/recording/RecordingSession';
import { agentsPool } from '../core/ws/AgentsPool';
import { RecordingJob, RecordingJobStatus } from '../models/entities/recording/RecordingJob';

type CreateParams = {
    userId: string;
    locationId: string;
    // Start time in ms since epoch (UTC)
    startTimeMs: number;
    // Duration in minutes (must be > 0 and multiple of slotMinutes)
    durationMinutes: number;
    // Slot size in minutes (default 30)
    slotMinutes?: number;
    // Optional status override; defaults to ARMED
    status?: RecordingSessionStatus;
    metadata?: any;
};

export class RecordingService {
    /** Compute YYYY-MM-DD day key in UTC */
    static toDayKeyUTC(d: Date): string {
        const y = d.getUTCFullYear();
        const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const da = d.getUTCDate().toString().padStart(2, '0');
        return `${y}-${m}-${da}`;
    }

    /** Compute slot index within a day (UTC) for a given slot size */
    static slotIndexUTC(d: Date, slotMinutes: number): number {
        const minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
        return Math.floor(minutes / slotMinutes);
    }

    static slotsPerDay(slotMinutes: number): number {
        return Math.ceil(24 * 60 / slotMinutes);
    }

    /**
     * Create a new recording session using an absolute start time.
     * Computes slots based on LOCAL time of the provided Date (to align with UI).
     * Does not allow crossing midnight and prevents overlaps.
     */
    static async create(params: CreateParams): Promise<IRecordingSessionDoc> {
        const slotMinutes = params.slotMinutes ?? 30;
        if (slotMinutes <= 0 || 1440 % slotMinutes !== 0) {
            throw new Error('slotMinutes must be a positive divisor of 1440');
        }
        if (!params.userId) throw new Error('userId is required');
        if (!params.locationId) throw new Error('locationId is required');
        if (!Number.isFinite(params.startTimeMs)) throw new Error('startTimeMs is required');
        if (!Number.isFinite(params.durationMinutes) || params.durationMinutes <= 0) {
            throw new Error('durationMinutes must be a positive number');
        }
        if (params.durationMinutes % slotMinutes !== 0) {
            throw new Error(`durationMinutes must be a multiple of slotMinutes (${slotMinutes})`);
        }

        const start = new Date(params.startTimeMs);
        // Use LOCAL day and slot to match the admin UI selection
        const dayKey = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;
        const minutesLocal = start.getHours() * 60 + start.getMinutes();
        const slotIndex = Math.floor(minutesLocal / slotMinutes);
        const slotsNeeded = Math.floor(params.durationMinutes / slotMinutes);
        const endSlot = slotIndex + slotsNeeded;
        const maxSlots = this.slotsPerDay(slotMinutes);

        // disallow crossing midnight (UTC)
        if (endSlot > maxSlots) {
            throw new Error('Recording cannot cross day boundary');
        }

        // Prevent overlap: any session S with S.start < end AND S.end > start
        const overlapping = await RecordingSessionModel.findOne({
            locationId: params.locationId,
            dayKey,
            slotIndex: { $lt: endSlot },
            $expr: { $gt: [{ $add: ["$slotIndex", "$duration"] }, slotIndex] }
        }).lean().exec();
        if (overlapping) {
            throw new Error('Requested time overlaps with an existing recording');
        }

        const status = params.status ?? RecordingSessionStatus.ARMED;

        const created = await RecordingSessionModel.create({
            userId: params.userId,
            locationId: params.locationId,
            dayKey,
            slotIndex,
            slotDuration: slotMinutes,
            duration: slotsNeeded,
            views: 0,
            status,
            metadata: params.metadata ?? {}
        });

        return created;
    }

    /** Create using explicit slot coordinates (preferred for UI to avoid TZ issues) */
    static async createFromSlots(params: {
        userId: string;
        locationId: string;
        dayKey: string; // YYYY-MM-DD in local notion
        slotIndex: number;
        durationSlots: number;
        slotMinutes?: number;
        status?: RecordingSessionStatus;
        metadata?: any;
    }): Promise<IRecordingSessionDoc> {
        const slotMinutes = params.slotMinutes ?? 30;
        const maxSlots = this.slotsPerDay(slotMinutes);
        if (params.slotIndex < 0 || params.slotIndex >= maxSlots) throw new Error('slotIndex out of range');
        if (params.durationSlots <= 0) throw new Error('durationSlots must be positive');
        if (params.slotIndex + params.durationSlots > maxSlots) throw new Error('Recording cannot cross day boundary');

        const overlapping = await RecordingSessionModel.findOne({
            locationId: params.locationId,
            dayKey: params.dayKey,
            slotIndex: { $lt: params.slotIndex + params.durationSlots },
            $expr: { $gt: [{ $add: ["$slotIndex", "$duration"] }, params.slotIndex] }
        }).lean().exec();
        if (overlapping) throw new Error('Requested time overlaps with an existing recording');

        const status = params.status ?? RecordingSessionStatus.ARMED;

        return RecordingSessionModel.create({
            userId: params.userId,
            locationId: params.locationId,
            dayKey: params.dayKey,
            slotIndex: params.slotIndex,
            slotDuration: slotMinutes,
            duration: params.durationSlots,
            views: 0,
            status,
            metadata: params.metadata ?? {},
        });
    }

    // ---- Agent trigger (immediate) ----
    static async triggerAgentStart(locationId: string, opts: { durationMinutes: number; metadata?: any; recordingId?: string; userId?: string }) {
        const agent = agentsPool.get(locationId);
        if (!agent || !agent.ws) throw new Error('Agent offline');
        if (agent.activity === 'RECORDING') {
            const { BusinessError } = await import('../errors/BusinessError');
            throw new BusinessError('AGENT_BUSY', 'Agent is already recording');
        }
        const recordingId = opts.recordingId || `rec_${locationId}_${Date.now()}`;
        const payload = {
            type: 'command',
            cmd: 'startRecording',
            locationId,
            durationMinutes: Math.max(1, Math.floor(opts.durationMinutes || 0)),
            metadata: { ...(opts.metadata || {}), recordingId },
            recordingId,
        };
        // persist lightweight session for audit
        await RecordingJob.create({
            recordingId,
            locationId,
            userId: opts.userId,
            startTimeMs: Date.now(),
            durationMinutes: Math.max(1, Math.floor(opts.durationMinutes || 0)),
            status: RecordingJobStatus.RECORDING,
            metadata: opts.metadata || {},
        });
        agent.ws.send(JSON.stringify(payload));
        return recordingId;
    }
}
