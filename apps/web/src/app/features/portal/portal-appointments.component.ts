import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentStatus, AppointmentBooking } from '@profilease/types';
import { AppointmentService } from '@service/appointment.service';
import { ClientAuthService } from '@service/client-auth.service';
import { SharpBadgeComponent, BadgeVariant } from '@shared/components/sharp-badge.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-portal-appointments',
  imports: [
    CommonModule,
    SharpBadgeComponent,
    SharpIconComponent,
  ],
  templateUrl: './portal-appointments.component.html',
})
export class PortalAppointmentsComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly clientAuth = inject(ClientAuthService);

  readonly filterOptions = ['all', 'pending', 'confirmed', 'declined', 'completed', 'cancelled'] as const;
  readonly selectedFilter = signal<string>('all');

  readonly appointments = this.appointmentService.appointments;

  readonly filteredAppointments = computed(() => {
    const list = this.appointments();
    const filter = this.selectedFilter();
    if (filter === 'all') return list;
    return list.filter((a) => a.status === filter);
  });

  ngOnInit(): void {
    const profile = this.clientAuth.currentProfile();
    if (profile) {
      this.appointmentService.loadForClient(profile.id).subscribe();
    }
  }

  updateStatus(id: string, status: AppointmentStatus): void {
    this.appointmentService.updateClientAppointmentStatus(id, status).subscribe();
  }

  getStatusBadge(status: AppointmentStatus): BadgeVariant {
    switch (status) {
      case 'confirmed':
        return 'green';
      case 'pending':
        return 'amber';
      case 'declined':
      case 'cancelled':
        return 'red';
      case 'completed':
        return 'indigo';
      default:
        return 'neutral';
    }
  }
}
