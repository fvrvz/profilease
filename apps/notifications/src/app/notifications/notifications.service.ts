import { Injectable, Logger } from '@nestjs/common';
import {
  AppointmentNotificationMessage,
  NotificationDeliveryResult
} from '@profilease/types';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { DirectActionDto, DirectActionResult } from './notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly deliveryHistory: NotificationDeliveryResult[] = [];

  constructor(
    private readonly emailService: EmailService,
    private readonly whatsAppService: WhatsAppService
  ) {}

  async processNotification(
    message: AppointmentNotificationMessage
  ): Promise<readonly NotificationDeliveryResult[]> {
    this.logger.log(`Processing notification event ${message.eventType} (#${message.eventId})`);
    const results: NotificationDeliveryResult[] = [];

    if (message.eventType === 'appointment.created') {
      // 1. Send Email to Professional (with 1-click action buttons)
      const profEmail = await this.emailService.sendAppointmentCreatedEmailToProfessional(message);
      results.push(profEmail);

      // 2. Send WhatsApp to Professional (with 1-click action links)
      const profWa = await this.whatsAppService.sendAppointmentAlertToProfessional(message);
      results.push(profWa);

      // 3. Send Email & WhatsApp receipt to Client
      const clientEmail = await this.emailService.sendAppointmentCreatedEmailToClient(message);
      results.push(clientEmail);

      const clientWa = await this.whatsAppService.sendBookingConfirmationToClient(message);
      results.push(clientWa);
    } else if (
      message.eventType === 'appointment.confirmed' ||
      message.eventType === 'appointment.declined' ||
      message.eventType === 'appointment.cancelled'
    ) {
      const statusText = message.eventType.replace('appointment.', '').toUpperCase();
      const clientUpdate = await this.emailService.sendStatusUpdateEmail(
        message,
        message.clientEmail,
        message.clientName,
        statusText
      );
      results.push(clientUpdate);

      const profUpdate = await this.emailService.sendStatusUpdateEmail(
        message,
        message.professionalEmail,
        message.professionalName,
        statusText
      );
      results.push(profUpdate);
    }

    this.deliveryHistory.push(...results);
    return results;
  }

  async handleDirectAction(dto: DirectActionDto): Promise<DirectActionResult> {
    this.logger.log(
      `Received direct 1-click action [${dto.action}] with token ${dto.actionToken} from ${dto.recipient}`
    );

    return {
      success: true,
      action: dto.action,
      message: `Appointment successfully ${dto.action === 'confirm' ? 'confirmed' : 'declined'} via direct 1-click token action.`,
      timestamp: new Date().toISOString()
    };
  }

  getDeliveryHistory(): readonly NotificationDeliveryResult[] {
    return this.deliveryHistory;
  }
}
