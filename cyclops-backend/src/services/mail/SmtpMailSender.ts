import {EmailPayload, IEmailSender} from "./IEmailSender";
import nodemailer, {Transporter} from 'nodemailer';
import {env} from "../../config/env";

export class SmtpMailSender implements IEmailSender {
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtppro.zoho.com', // or 'smtp.zoho.com' depending on your region
            port: 465,
            secure: true,
            auth: {
                user: env.ZOHO_MAIL,
                pass: env.ZOHO_PASSWORD,
            },
        });
    }

    async sendEmail(payload: EmailPayload): Promise<void> {
        const mailOptions = {
            from: env.ZOHO_MAIL,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('📧 Email sent:', info.messageId);
        } catch (error) {
            console.error('❌ Email send failed:', error);
            throw error;
        }
    }
}