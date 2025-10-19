import { IEmailSender, EmailPayload } from './IEmailSender';

export class MockEmailSender implements IEmailSender {
    async sendEmail(payload: EmailPayload): Promise<void> {
        console.log('📧 Mock Email Sent:');
        console.log('To:', payload.to);
        console.log('Subject:', payload.subject);
        console.log('HTML:', payload.html);
        if (payload.text) console.log('Text:', payload.text);
    }
}