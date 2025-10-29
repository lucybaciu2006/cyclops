import { Request, Response } from 'express';
import { RecordingSessionModel } from '../../models/entities/recording/RecordingSession';
import { RecordingService } from '../../services/RecordingService';

export class AdminRecordingSessionsController {
    // GET /api/admin/recording-sessions?locationId=...&fromDay=YYYY-MM-DD&toDay=YYYY-MM-DD
    static async list(req: Request, res: Response) {
        try {
            const { locationId, fromDay, toDay } = req.query as Record<string, string>;
            if (!locationId) return res.status(400).json({ error: 'locationId is required' });

            const filter: any = { locationId };
            if (fromDay && toDay) {
                filter.dayKey = { $gte: fromDay, $lte: toDay };
            } else if (fromDay) {
                filter.dayKey = { $gte: fromDay };
            } else if (toDay) {
                filter.dayKey = { $lte: toDay };
            }

            const sessions = await RecordingSessionModel.find(filter).lean().exec();
            res.json(sessions);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // POST /api/admin/recording-sessions
    // body: { userId?, locationId, startTimeMs?, durationMinutes, slotMinutes?, dayKey?, slotIndex?, durationSlots? }
    static async create(req: Request, res: Response) {
        try {
            const { userId, locationId, startTimeMs, durationMinutes, slotMinutes, status, metadata, dayKey, slotIndex, durationSlots } = req.body || {};
            if (!locationId) return res.status(400).json({ error: 'locationId is required' });
            let created;
            if (dayKey != null && slotIndex != null) {
                const durSlots = durationSlots != null ? Number(durationSlots) : Math.floor(Number(durationMinutes) / (slotMinutes ?? 30));
                created = await RecordingService.createFromSlots({
                    userId: userId || 'admin',
                    locationId,
                    dayKey,
                    slotIndex: Number(slotIndex),
                    durationSlots: durSlots,
                    slotMinutes: slotMinutes != null ? Number(slotMinutes) : undefined,
                    status,
                    metadata,
                });
            } else {
                if (startTimeMs == null) return res.status(400).json({ error: 'startTimeMs is required' });
                if (durationMinutes == null) return res.status(400).json({ error: 'durationMinutes is required' });
                created = await RecordingService.create({
                    userId: userId || 'admin',
                    locationId,
                    startTimeMs: Number(startTimeMs),
                    durationMinutes: Number(durationMinutes),
                    slotMinutes: slotMinutes != null ? Number(slotMinutes) : undefined,
                    status,
                    metadata,
                });
            }
            res.status(201).json(created);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
