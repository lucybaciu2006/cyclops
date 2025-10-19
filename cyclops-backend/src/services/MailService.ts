import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import mjml2html from 'mjml';
import {MockEmailSender} from "./mail/MockEmailSender";
import {MailgunEmailSender} from "./mail/MailgunEmailSender";
import {IEmailSender} from "./mail/IEmailSender";
import {env} from "../config/env";
import {AdminNotificationEvent} from "./NotificationService";
import {SmtpMailSender} from "./mail/SmtpMailSender";

const emailSender: IEmailSender = env.MOCK_EMAILS ? new MockEmailSender(): new SmtpMailSender();

const layoutPath = path.join(process.cwd(), 'templates', 'emails', 'layout.mjml');
const layout = fs.readFileSync(layoutPath, 'utf-8');

const adminTemplates: Record<AdminNotificationEvent, {template: string, title: string}> = {
  [AdminNotificationEvent.CONTACT_MESSAGE_RECEIVED]: {template: 'contact-message.mjml', title: 'Contact message received'},
  [AdminNotificationEvent.USER_REGISTERED]: {template: 'user-registered.mjml', title: 'New User registered'},
  [AdminNotificationEvent.INTERNAL_ERROR]: {template: 'internal-error.mjml', title: 'Internal Error!'},
  [AdminNotificationEvent.CRITICAL_ERROR]: {template: 'internal-error.mjml', title: 'Critical Error!'},
}

export class MailService {
  static async sendConfirmEmail(to: string, name: string, token: string) {
    const confirmationLink = env.APP_BASE_DOMAIN + "/confirm-email?token=" + token;
    await this.sendEmail(to, "Welcome to Our App", "confirm-email.body.mjml", {
      name: name,
      confirmation_link: confirmationLink,
    });
  }

  static async sendContactUsResponseEmail(to: string) {
    await this.sendEmail(to, "We've received your message", "contact-message-received.mjml", {});
  }


  static async sendResetPasswordEmail(to: string, name: string, token: string) {
    const resetPasswordLink = env.APP_BASE_DOMAIN + "/reset-password?token=" + token;
    await this.sendEmail(to, "Reset Your Password", "reset-password.body.mjml", {
      name: name,
      reset_password_link: resetPasswordLink,
    });
  }

  static async sendAdminEmail(email: string, eventType: AdminNotificationEvent, payload?: Record<string, any>) {
    let templateConfig = adminTemplates[eventType];
    await this.sendEmail(email.trim(), templateConfig.title, 'admin/' + templateConfig.template, payload);
  }

  private static async sendEmail(to: string, subject: string, mjmlBodyTemplateFile: string, context?: Record<string, any>): Promise<void> {
    const templatePath = path.join(process.cwd(), "templates", "emails", mjmlBodyTemplateFile);
    const bodyMjmlRaw = fs.readFileSync(templatePath, "utf-8");

    // Render the body with context
    const bodyTemplate = handlebars.compile(bodyMjmlRaw);
    const renderedBody = bodyTemplate(context || {});

    // Inject body into layout
    const layoutTemplate = handlebars.compile(layout);
    const mergedMjml = layoutTemplate({ body: renderedBody });

    // Compile to HTML
    const html = mjml2html(mergedMjml).html;

    // Send the email
    await emailSender.sendEmail({ to, subject, html });
  }
}