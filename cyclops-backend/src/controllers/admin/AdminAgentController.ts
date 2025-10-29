import { Request, Response } from 'express';
import { RecordingService } from '../../services/RecordingService';
import { BusinessError } from '../../errors/BusinessError';

export class AdminAgentController {
  static async startRecording(req: Request, res: Response) {
    try {
      const { locationId } = req.params as any;
      const { durationMinutes, metadata } = req.body || {};
      if (!durationMinutes) return res.status(400).json({ error: 'durationMinutes required' });
      const recordingId = await RecordingService.triggerAgentStart(locationId, { durationMinutes: Number(durationMinutes), metadata });
      res.json({ ok: true, recordingId });
    } catch (e: any) {
      if (e instanceof BusinessError) {
        return res.status(503).json({ message: e.message, code: e.code });
      }
      res.status(400).json({ error: e?.message || 'Failed to start' });
    }
  }
}
