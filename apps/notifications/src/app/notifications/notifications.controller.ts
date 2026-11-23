import { Body, Controller, Get, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppointmentNotificationMessage, NotificationDeliveryResult } from '@profilease/types';
import { NotificationsService } from './notifications.service';
import { DirectActionDto, DirectActionResult, DispatchNotificationDto } from './notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // 1. RabbitMQ Microservice Pattern Handler
  @MessagePattern('appointment.created')
  async handleAppointmentCreatedMessage(
    @Payload() message: AppointmentNotificationMessage
  ): Promise<readonly NotificationDeliveryResult[]> {
    return this.notificationsService.processNotification(message);
  }

  @MessagePattern('appointment.status_changed')
  async handleAppointmentStatusChangedMessage(
    @Payload() message: AppointmentNotificationMessage
  ): Promise<readonly NotificationDeliveryResult[]> {
    return this.notificationsService.processNotification(message);
  }

  // 2. HTTP REST Endpoints (for direct HTTP or webhook invocation)
  @Post('dispatch')
  async dispatchNotificationHttp(
    @Body() dto: DispatchNotificationDto
  ): Promise<{ success: boolean; results: readonly NotificationDeliveryResult[] }> {
    const results = await this.notificationsService.processNotification(dto.message);
    return { success: true, results };
  }

  @Post('direct-action')
  async processDirectAction(
    @Body() dto: DirectActionDto
  ): Promise<DirectActionResult> {
    return this.notificationsService.handleDirectAction(dto);
  }

  @Get('history')
  getDeliveryHistory(): { total: number; logs: readonly NotificationDeliveryResult[] } {
    const history = this.notificationsService.getDeliveryHistory();
    return {
      total: history.length,
      logs: history
    };
  }
}
