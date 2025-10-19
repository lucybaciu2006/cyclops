import { Request, Response } from "express";
import {SportLocation} from "../models/entities/SportLocation";

export class SportLocationController {
    public static async getSportLocationBySlang(req: Request, res: Response): Promise<void> {
        try {
            const { slug } = req.params;

            const location = await SportLocation.findOne({ slug });

            if (!location) {
                res.status(503).json({ code: 'NOT_FOUND' });
                return;
            }
            res.json(location);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
