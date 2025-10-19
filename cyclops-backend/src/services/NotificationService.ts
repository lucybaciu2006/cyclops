import {env} from "../config/env";
import {MailService} from "./MailService";

export enum AdminNotificationEvent {
    CONTACT_MESSAGE_RECEIVED,
    USER_REGISTERED,
    CRITICAL_ERROR,
    INTERNAL_ERROR
}

export class NotificationService {

    static async notifyAdmins(event: AdminNotificationEvent, payload: any) {
        // let adminEmails = env.ADMIN_EMAILS.split(',');
        // const promises: Promise<any>[] = [];
        // adminEmails.forEach(email => {
        //     promises.push(MailService.sendAdminEmail(email.trim(), event, payload));
        // });
        await Promise.all([]);
    }

}