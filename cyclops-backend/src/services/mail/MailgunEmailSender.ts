import { IEmailSender, EmailPayload } from './IEmailSender';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import {env} from "../../config/env";

const mailgun = new Mailgun(formData);

export class MailgunEmailSender implements IEmailSender {
    private client = mailgun.client({
        username: 'api',
        key: env.MAILGUN_API_KEY as string,
    });

    async sendEmail(payload: EmailPayload): Promise<void> {
        try{
        await this.client.messages.create(env.MAILGUN_DOMAIN as string, {
            from: `Your App <no-reply@${env.MAILGUN_DOMAIN}>`,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
        });
        console.log("Email sent successfully to ", payload.to);
        } catch (error) {
            console.error("Error sending email", error);
        }
    }
}