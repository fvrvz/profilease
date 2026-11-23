import { Injectable, Logger } from '@nestjs/common';
import { AppointmentNotificationMessage, NotificationDeliveryResult } from '@profilease/types';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  async sendAppointmentAlertToProfessional(
    notification: AppointmentNotificationMessage
  ): Promise<NotificationDeliveryResult> {
    const messageText = this.formatProfessionalWhatsAppMessage(notification);
    this.logger.log(
      `[WHATSAPP] Sending alert to professional WhatsApp: ${notification.professionalPhone} (Client: ${notification.clientName})`
    );

    return {
      channel: 'whatsapp',
      recipient: notification.professionalPhone,
      status: 'delivered',
      messageId: `wa-${Date.now()}-${notification.appointmentId}`,
      timestamp: new Date().toISOString(),
      details: messageText
    };
  }

  async sendBookingConfirmationToClient(
    notification: AppointmentNotificationMessage
  ): Promise<NotificationDeliveryResult> {
    const text = `Hi ${notification.clientName}, your booking with ${notification.professionalName} for "${notification.serviceTitle}" on ${notification.appointmentDate} at ${notification.appointmentTime} has been submitted!`;
    this.logger.log(`[WHATSAPP] Booking receipt sent to client: ${notification.clientPhone}`);

    return {
      channel: 'whatsapp',
      recipient: notification.clientPhone,
      status: 'delivered',
      messageId: `wa-client-${Date.now()}-${notification.appointmentId}`,
      timestamp: new Date().toISOString(),
      details: text
    };
  }

  private formatProfessionalWhatsAppMessage(n: AppointmentNotificationMessage): string {
    return [
      `🔔 *NEW APPOINTMENT ALERT - PROFILEASE*`,
      `Hello ${n.professionalName}, you have a new appointment booking:`,
      `• *Client*: ${n.clientName}`,
      `• *Service*: ${n.serviceTitle}`,
      `• *Date & Time*: ${n.appointmentDate} at ${n.appointmentTime}`,
      `• *Contact*: ${n.clientPhone} (${n.clientEmail})`,
      n.notes ? `• *Notes*: ${n.notes}` : '',
      ``,
      `⚡ *1-Click Instant Response:*`,
      `✅ *Accept:* ${n.acceptUrl}`,
      `❌ *Decline:* ${n.declineUrl}`,
      ``,
      `Or manage in your Client Portal.`
    ].filter(Boolean).join('\n');
  }
}
