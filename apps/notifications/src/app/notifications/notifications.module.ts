import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, WhatsAppService],
  exports: [NotificationsService, EmailService, WhatsAppService]
})
export class NotificationsModule {}
