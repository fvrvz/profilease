import { AppointmentNotificationMessage, NotificationDeliveryResult, NotificationChannel } from '@profilease/types';

export interface DispatchNotificationDto {
  readonly message: AppointmentNotificationMessage;
}

export interface DirectActionDto {
  readonly actionToken: string;
  readonly action: 'confirm' | 'decline';
  readonly recipient: string;
}

export interface DirectActionResult {
  readonly success: boolean;
  readonly action: 'confirm' | 'decline';
  readonly message: string;
  readonly appointmentId?: string;
  readonly timestamp: string;
}

export type { AppointmentNotificationMessage, NotificationDeliveryResult, NotificationChannel };
