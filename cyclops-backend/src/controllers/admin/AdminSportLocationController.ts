import { Request, Response } from 'express';
import {ISportLocation, SportLocation} from "../../models/location/SportLocation";
import {SportLocationService} from "../../services/SportLocationService";

export interface PlayAreaListFilters {
    search?: string;
}

export class AdminSportLocationController {

    static async list(req: Request, res: Response) {
        try {
            res.json(await SportLocation.find());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const location = await SportLocation.create(req.body);
            res.status(201).json(location);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async update(req: Request, res: Response): Promise<void> {
            const id = req.params.id;
            const body: Partial<ISportLocation> = req.body;

            const location = await SportLocation.findByIdAndUpdate(id, body, {
                new: true, // return updated document
                runValidators: true, // validate against schema
            });

            if (!location) {
                res.status(404).json({ error: "SportLocation not found" });
            }

            res.json(location);
    }

    public static async uploadThumbnail(req: Request, res: Response): Promise<void> {
        try {
            const file = req.file; // For raw file uploads
            const locationId = req.params.id;

            if (file) {
                // Handle file upload
                const updatedProperty = await SportLocationService.updatePlayAreaImage(locationId, file);
                res.status(200).json(updatedProperty);
            } else {
                res.status(400).json({ message: 'A valid file is required.' });
            }

        } catch (err) {
            console.error('Upload thumbnail failed:', err);
            res.status(500).json({ message: 'Failed to upload thumbnail.', error: err });
        }
    }

    static async delete(req: Request, res: Response): Promise<void> {
        try {
            const playArea = await SportLocation.findByIdAndDelete(req.params.id);
            if (!playArea) {
                res.status(404).json({ error: 'PlayArea not found' });
                return;
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getOne(req: Request, res: Response) {
        try {
            const playArea = await SportLocation.findById(req.params.id);
            if (!playArea) {
                return res.status(404).json({ error: 'PlayArea not found' });
            }
            res.json(playArea);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
