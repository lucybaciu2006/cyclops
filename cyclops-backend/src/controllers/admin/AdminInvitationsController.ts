import { Request, Response } from 'express';
import {InvitationCode} from "../../models/InvitationCode";
import {SearchOptions} from "./model/SearchOptions";
import {AdminUtils} from "./AdminUtils";
import {VoIPNumbersService} from "../../services/VoIPNumbersService";
import {PhoneNumbersListFilters} from "./AdminPhoneNumbersController";
import {InvitationCodesService} from "../../services/InvitationCodesService";

export interface InvitationListFilters {
    search?: string;
}

export class AdminInvitationsController {

    static async list(req: Request, res: Response) {
        try {
            const options: SearchOptions = AdminUtils.extractSearchOptions<InvitationListFilters>(req);

            const result = await InvitationCodesService.list(options);
            const count = await InvitationCodesService.count(options);
            res.setHeader('Content-Range', count);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const code = (await InvitationCode.create(req.body)).toObject();
            code.id = code._id;
            res.status(201).json(code);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const deleted = await InvitationCode.findByIdAndDelete(id);

            if (!deleted) {
                return res.status(404).json({ error: "Invitation code not found" });
            }

            res.status(200).json({ id }); // React Admin expects `{ id: ... }` as confirmation
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

}