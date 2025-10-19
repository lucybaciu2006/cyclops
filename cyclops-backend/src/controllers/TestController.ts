import { Request, Response } from 'express';
import {MailService} from "../services/MailService";

export class TestController {
    public static async sendEmail(req: Request, res: Response): Promise<void> {
        await MailService.sendConfirmEmail('luci@yahoo.com', 'Lucian Baciu', 'secretToken');
    }
}