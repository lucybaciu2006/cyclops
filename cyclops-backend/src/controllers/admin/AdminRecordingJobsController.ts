import { Request, Response } from 'express';
import { RecordingJob } from '../../models/entities/recording/RecordingJob';

export class AdminRecordingJobsController {
  static async list(req: Request, res: Response) {
    try {
      const locationId = (req.query.locationId as string) || (req.params as any)?.locationId;
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
      if (!locationId) return res.status(400).json({ error: 'locationId is required' });
      const jobs = await RecordingJob.find({ locationId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();
      res.json(jobs);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed to load jobs' });
    }
  }
}

