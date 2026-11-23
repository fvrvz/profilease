import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { AppointmentNotificationMessage } from '@profilease/types';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, EmailService, WhatsAppService],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should process appointment.created event and dispatch email and WhatsApp', async () => {
    const mockMsg: AppointmentNotificationMessage = {
      eventId: 'evt-test-1',
      eventType: 'appointment.created',
      appointmentId: 'apt-test-1',
      profileId: 'prof-doc-1',
      clientName: 'Alice Walker',
      clientEmail: 'alice@example.com',
      clientPhone: '+1-555-0101',
      professionalName: 'Dr. Elena Vance',
      professionalEmail: 'elena@vanceneuro.com',
      professionalPhone: '+1-555-0199',
      serviceTitle: 'Initial Neurological Consultation',
      appointmentDate: '2026-11-28',
      appointmentTime: '10:00',
      notes: 'Experiencing recurring migraines',
      actionToken: 'act-token-123',
      acceptUrl: 'http://localhost:4000/api/appointments/action?token=act-token-123&action=confirm',
      declineUrl: 'http://localhost:4000/api/appointments/action?token=act-token-123&action=decline',
      channels: ['email', 'whatsapp'],
      sentAt: new Date().toISOString()
    };

    const results = await service.processNotification(mockMsg);
    expect(results.length).toBe(4); // 2 to professional (email + wa), 2 to client (email + wa)
    expect(results.some((r) => r.channel === 'email' && r.recipient === mockMsg.professionalEmail)).toBe(true);
    expect(results.some((r) => r.channel === 'whatsapp' && r.recipient === mockMsg.professionalPhone)).toBe(true);
  });

  it('should handle direct 1-click token action', async () => {
    const result = await service.handleDirectAction({
      actionToken: 'act-token-123',
      action: 'confirm',
      recipient: 'elena@vanceneuro.com'
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('confirm');
  });
});
