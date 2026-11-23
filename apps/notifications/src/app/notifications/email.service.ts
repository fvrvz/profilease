import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppointmentNotificationMessage, NotificationDeliveryResult } from '@profilease/types';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as handlebars from 'handlebars';
import { Resend } from 'resend';

type TemplateDelegate = handlebars.TemplateDelegate;

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly templateCache = new Map<string, TemplateDelegate>();
  private resend: Resend | null = null;
  private fromAddress = 'onboarding@resend.dev';

  onModuleInit(): void {
    this.preloadTemplates();

    const apiKey = process.env['RESEND_API_KEY'];
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.fromAddress = process.env['RESEND_FROM_EMAIL'] || 'onboarding@resend.dev';
      this.logger.log(`📧 Resend SDK initialized. Outbound sender: ${this.fromAddress}`);
    } else {
      this.logger.log('ℹ️ RESEND_API_KEY not set; running in template simulation mode');
    }
  }

  private preloadTemplates(): void {
    const templateNames = [
      'professional-booking-alert',
      'client-booking-receipt',
      'status-update',
    ];

    for (const name of templateNames) {
      this.getCompiledTemplate(name);
    }
  }

  private getCompiledTemplate(templateName: string): TemplateDelegate {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const possiblePaths = [
      path.resolve(__dirname, 'assets/templates', `${templateName}.hbs`),
      path.resolve(process.cwd(), 'apps/notifications/src/assets/templates', `${templateName}.hbs`),
      path.resolve(process.cwd(), 'dist/apps/notifications/assets/templates', `${templateName}.hbs`),
    ];

    for (const templatePath of possiblePaths) {
      if (fs.existsSync(templatePath)) {
        try {
          const raw = fs.readFileSync(templatePath, 'utf-8');
          const compiled = handlebars.compile(raw);
          this.templateCache.set(templateName, compiled);
          this.logger.log(`[TEMPLATE ENGINE] Successfully compiled email template: ${templateName}`);
          return compiled;
        } catch (err) {
          this.logger.warn(`Failed reading template at ${templatePath}: ${(err as Error).message}`);
        }
      }
    }

    // Fallback inline template compiler if template file not found on disk
    this.logger.warn(`[TEMPLATE ENGINE] Template '${templateName}' not found on disk; utilizing fallback compiler.`);
    const fallback = handlebars.compile(`
      <div style="font-family: monospace; padding: 24px; border: 2px solid #0f172a;">
        <h2>Profilease Notification: {{serviceTitle}}</h2>
        <p>Booking with {{clientName}} on {{appointmentDate}} at {{appointmentTime}}.</p>
        {{#if acceptUrl}}<p><a href="{{acceptUrl}}">Accept</a> | <a href="{{declineUrl}}">Decline</a></p>{{/if}}
      </div>
    `);
    this.templateCache.set(templateName, fallback);
    return fallback;
  }

  private async dispatchViaResend(
    to: string,
    subject: string,
    html: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!this.resend) {
      return { success: true, id: `sim-${Date.now()}` };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: `Profilease <${this.fromAddress}>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.warn(`Resend dispatch notice for ${to}: ${error.message}`);
        return { success: false, error: error.message };
      }

      this.logger.log(`🚀 Live email dispatched via Resend to ${to} (Message ID: ${data?.id})`);
      return { success: true, id: data?.id };
    } catch (err) {
      this.logger.error(`Resend dispatch exception for ${to}: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  async sendAppointmentCreatedEmailToProfessional(
    notification: AppointmentNotificationMessage
  ): Promise<NotificationDeliveryResult> {
    const template = this.getCompiledTemplate('professional-booking-alert');
    const htmlBody = template(notification);

    this.logger.log(
      `[EMAIL ENGINE] Rendered professional email via Handlebars (${htmlBody.length} bytes) for ${notification.professionalEmail} (Appointment #${notification.appointmentId})`
    );

    const subject = `New Appointment Request: ${notification.clientName} (${notification.appointmentDate})`;
    const result = await this.dispatchViaResend(notification.professionalEmail, subject, htmlBody);

    return {
      channel: 'email',
      recipient: notification.professionalEmail,
      status: result.success ? 'delivered' : 'failed',
      messageId: result.id || `email-${Date.now()}-${notification.appointmentId}`,
      timestamp: new Date().toISOString(),
      details: result.error
        ? `Handlebars rendered. Resend notice: ${result.error}`
        : `Delivered via Resend. Accept: ${notification.acceptUrl} | Decline: ${notification.declineUrl}`,
    };
  }

  async sendAppointmentCreatedEmailToClient(
    notification: AppointmentNotificationMessage
  ): Promise<NotificationDeliveryResult> {
    const template = this.getCompiledTemplate('client-booking-receipt');
    const htmlBody = template(notification);

    this.logger.log(
      `[EMAIL ENGINE] Rendered client receipt via Handlebars (${htmlBody.length} bytes) for ${notification.clientEmail}`
    );

    const subject = `Booking Received: ${notification.serviceTitle} with ${notification.professionalName}`;
    const result = await this.dispatchViaResend(notification.clientEmail, subject, htmlBody);

    return {
      channel: 'email',
      recipient: notification.clientEmail,
      status: result.success ? 'delivered' : 'failed',
      messageId: result.id || `email-client-${Date.now()}-${notification.appointmentId}`,
      timestamp: new Date().toISOString(),
      details: result.error
        ? `Handlebars rendered. Resend notice: ${result.error}`
        : `Confirmation sent via Resend to ${notification.clientEmail} for ${notification.serviceTitle}`,
    };
  }

  async sendStatusUpdateEmail(
    notification: AppointmentNotificationMessage,
    recipientEmail: string,
    recipientName: string,
    statusText: string
  ): Promise<NotificationDeliveryResult> {
    const template = this.getCompiledTemplate('status-update');
    const statusClass =
      statusText.toLowerCase() === 'confirmed'
        ? 'status-confirmed'
        : statusText.toLowerCase() === 'declined'
        ? 'status-declined'
        : 'status-cancelled';

    const htmlBody = template({
      ...notification,
      recipientEmail,
      recipientName,
      statusText,
      statusClass,
    });

    this.logger.log(
      `[EMAIL ENGINE] Status update [${statusText}] rendered via Handlebars (${htmlBody.length} bytes) for ${recipientEmail}`
    );

    const subject = `Appointment ${statusText.toUpperCase()}: ${notification.serviceTitle} on ${notification.appointmentDate}`;
    const result = await this.dispatchViaResend(recipientEmail, subject, htmlBody);

    return {
      channel: 'email',
      recipient: recipientEmail,
      status: result.success ? 'delivered' : 'failed',
      messageId: result.id || `email-status-${Date.now()}-${notification.appointmentId}`,
      timestamp: new Date().toISOString(),
      details: result.error
        ? `Status update rendered. Resend notice: ${result.error}`
        : `Status notification [${statusText}] delivered via Resend to ${recipientName} (${recipientEmail})`,
    };
  }
}
