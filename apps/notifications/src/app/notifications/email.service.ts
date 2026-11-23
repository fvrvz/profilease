import { Injectable, Logger } from '@nestjs/common';
import { AppointmentNotificationMessage, NotificationDeliveryResult } from '@profilease/types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendAppointmentCreatedEmailToProfessional(
    notification: AppointmentNotificationMessage
  ): Promise<NotificationDeliveryResult> {
    const htmlBody = this.generateProfessionalEmailHtml(notification);
    this.logger.log(
      `[EMAIL] Sending new booking notification to professional: ${notification.professionalEmail} (Appointment #${notification.appointmentId})`
    );

    // Simulated email delivery; logs rendered content and buttons
    return {
      channel: 'email',
      recipient: notification.professionalEmail,
      status: 'delivered',
      messageId: `email-${Date.now()}-${notification.appointmentId}`,
      timestamp: new Date().toISOString(),
      details: `Dispatched booking notification with 1-click action buttons. Accept: ${notification.acceptUrl} | Decline: ${notification.declineUrl}`
    };
  }

  async sendAppointmentCreatedEmailToClient(
    notification: AppointmentNotificationMessage
  ): Promise<NotificationDeliveryResult> {
    this.logger.log(
      `[EMAIL] Sending confirmation receipt to client: ${notification.clientEmail} for appointment with ${notification.professionalName}`
    );

    return {
      channel: 'email',
      recipient: notification.clientEmail,
      status: 'delivered',
      messageId: `email-client-${Date.now()}-${notification.appointmentId}`,
      timestamp: new Date().toISOString(),
      details: `Confirmation sent to ${notification.clientEmail} for ${notification.serviceTitle} on ${notification.appointmentDate}`
    };
  }

  async sendStatusUpdateEmail(
    notification: AppointmentNotificationMessage,
    recipientEmail: string,
    recipientName: string,
    statusText: string
  ): Promise<NotificationDeliveryResult> {
    this.logger.log(
      `[EMAIL] Status update [${statusText}] sent to ${recipientEmail} for appointment #${notification.appointmentId}`
    );

    return {
      channel: 'email',
      recipient: recipientEmail,
      status: 'delivered',
      messageId: `email-status-${Date.now()}-${notification.appointmentId}`,
      timestamp: new Date().toISOString(),
      details: `Status notification [${statusText}] delivered to ${recipientName} (${recipientEmail})`
    };
  }

  private generateProfessionalEmailHtml(n: AppointmentNotificationMessage): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Appointment Request</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
    .box { max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #0f172a; border-radius: 0; padding: 32px; }
    .badge { display: inline-block; background: #0f172a; color: #ffffff; padding: 4px 10px; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; border-radius: 0; margin-bottom: 16px; }
    h1 { font-size: 22px; color: #0f172a; margin: 0 0 16px 0; font-weight: 800; letter-spacing: -0.02em; }
    .details { border: 1px solid #e2e8f0; border-radius: 0; padding: 20px; background: #f8fafc; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .detail-label { color: #64748b; font-weight: 600; }
    .detail-value { color: #0f172a; font-weight: 700; }
    .btn-group { display: flex; gap: 12px; margin-top: 24px; }
    .btn { display: inline-block; padding: 12px 24px; font-weight: 700; font-size: 13px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 0; text-align: center; }
    .btn-accept { background: #0d9488; color: #ffffff; border: 2px solid #0d9488; }
    .btn-decline { background: #ef4444; color: #ffffff; border: 2px solid #ef4444; }
    .footer { margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="badge">Profilease Appointment Notification</div>
    <h1>New Booking from ${n.clientName}</h1>
    <p style="color: #475569; font-size: 14px; line-height: 1.5;">
      Hello ${n.professionalName}, you have received a new appointment booking. You can accept or decline this request directly below without logging into your dashboard:
    </p>

    <div class="details">
      <div class="detail-row"><span class="detail-label">Service:</span><span class="detail-value">${n.serviceTitle}</span></div>
      <div class="detail-row"><span class="detail-label">Date & Time:</span><span class="detail-value">${n.appointmentDate} at ${n.appointmentTime}</span></div>
      <div class="detail-row"><span class="detail-label">Patient/Client:</span><span class="detail-value">${n.clientName}</span></div>
      <div class="detail-row"><span class="detail-label">Contact:</span><span class="detail-value">${n.clientEmail} | ${n.clientPhone}</span></div>
      ${n.notes ? `<div class="detail-row"><span class="detail-label">Notes:</span><span class="detail-value">${n.notes}</span></div>` : ''}
    </div>

    <div class="btn-group">
      <a href="${n.acceptUrl}" class="btn btn-accept">Accept Appointment</a>
      <a href="${n.declineUrl}" class="btn btn-decline">Decline Request</a>
    </div>

    <div class="footer">
      <p>Secure 1-Click Action Token: <code>${n.actionToken}</code></p>
      <p>Powered by Profilease Instant Notification Engine.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
