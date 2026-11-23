import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentStatus, AppointmentBooking } from '@profilease/types';
import { AppointmentService } from '../../core/services/appointment.service';
import { ClientAuthService } from '../../core/services/client-auth.service';
import { SharpBadgeComponent, BadgeVariant } from '../../shared/components/sharp-badge.component';
import { SharpIconComponent } from '../../shared/components/sharp-icon.component';

@Component({
  selector: 'app-portal-appointments',
  imports: [
    CommonModule,
    SharpBadgeComponent,
    SharpIconComponent,
  ],
  template: `
    <div class="space-y-6 font-sans">
      <!-- Title & Notification Note -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-neutral-900 pb-4">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-neutral-500 block">Appointments Engine</span>
          <h1 class="text-2xl font-black uppercase tracking-tight text-neutral-900">
            Bookings & Client Requests
          </h1>
        </div>

        <!-- Filter Pills -->
        <div class="flex flex-wrap items-center gap-1 font-mono text-xs">
          @for (filter of filterOptions; track filter) {
            <button
              type="button"
              (click)="selectedFilter.set(filter)"
              [class]="selectedFilter() === filter
                ? 'px-3 py-1.5 bg-neutral-900 text-white font-bold uppercase'
                : 'px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-bold uppercase'"
            >
              {{ filter }}
            </button>
          }
        </div>
      </div>

      <!-- Autonomous Notification Callout -->
      <div class="p-4 bg-emerald-50 border-2 border-emerald-900 text-emerald-950 font-mono text-xs flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(6,78,59,1)]">
        <app-sharp-icon name="check" customClass="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
        <div>
          <strong class="font-bold uppercase tracking-wide block mb-1">Interactive 1-Click Notifications Active:</strong>
          <span>
            Whenever a client books an appointment, you also receive an instant <strong>Email</strong> and <strong>WhatsApp</strong> alert with direct 1-click <code>[ACCEPT]</code> and <code>[DECLINE]</code> buttons on your phone. You can approve or decline immediately without needing to open this dashboard!
          </span>
        </div>
      </div>

      <!-- Bookings List -->
      <div class="bg-white border-2 border-neutral-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div class="px-6 py-4 border-b-2 border-neutral-900 flex items-center justify-between bg-neutral-50">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-neutral-900"></span>
            <h2 class="text-xs font-mono font-bold uppercase tracking-widest text-neutral-900">
              {{ filteredAppointments().length }} Bookings Found ({{ selectedFilter() | uppercase }})
            </h2>
          </div>
          <span class="text-xs font-mono text-neutral-500">
            Auto-syncing client consultations
          </span>
        </div>

        @if (filteredAppointments().length === 0) {
          <div class="p-12 text-center text-neutral-500 font-mono text-xs">
            <p class="font-bold uppercase tracking-wide text-sm text-neutral-700 mb-1">No appointments found</p>
            <p>No consultations matching "{{ selectedFilter() }}" at this time.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr class="border-b border-neutral-200 bg-neutral-100/70 text-neutral-700 uppercase tracking-wider text-[11px]">
                  <th class="py-3 px-4">Client / Patient</th>
                  <th class="py-3 px-4">Contact</th>
                  <th class="py-3 px-4">Service</th>
                  <th class="py-3 px-4">Date & Time</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right">Direct Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200">
                @for (apt of filteredAppointments(); track apt.id) {
                  <tr class="hover:bg-neutral-50/80 transition-colors">
                    <td class="py-3.5 px-4">
                      <strong class="text-neutral-900 block text-sm">{{ apt.clientName }}</strong>
                      @if (apt.notes) {
                        <span class="text-[11px] text-neutral-600 block mt-0.5 italic">"{{ apt.notes }}"</span>
                      }
                    </td>
                    <td class="py-3.5 px-4 text-neutral-600">
                      <div>{{ apt.clientEmail }}</div>
                      <div class="text-[10px] text-neutral-500">{{ apt.clientPhone }}</div>
                    </td>
                    <td class="py-3.5 px-4 font-bold text-neutral-800">
                      {{ apt.serviceTitle }}
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="font-bold text-neutral-900">{{ apt.appointmentDate }}</span>
                      <span class="text-neutral-500 block text-[10px]">{{ apt.appointmentTime }}</span>
                    </td>
                    <td class="py-3.5 px-4">
                      <app-sharp-badge [variant]="getStatusBadge(apt.status)">
                        {{ apt.status }}
                      </app-sharp-badge>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="inline-flex items-center gap-1.5">
                        @if (apt.status === 'pending') {
                          <button
                            type="button"
                            (click)="updateStatus(apt.id, 'confirmed')"
                            class="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase hover:bg-emerald-700 border border-emerald-700 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            (click)="updateStatus(apt.id, 'declined')"
                            class="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold uppercase hover:bg-red-700 border border-red-700 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Decline
                          </button>
                        }
                        @if (apt.status === 'confirmed') {
                          <button
                            type="button"
                            (click)="updateStatus(apt.id, 'completed')"
                            class="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase hover:bg-blue-700 border border-blue-700 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Complete
                          </button>
                          <button
                            type="button"
                            (click)="updateStatus(apt.id, 'cancelled')"
                            class="px-2.5 py-1 bg-neutral-200 text-neutral-800 text-[10px] font-bold uppercase hover:bg-neutral-300 border border-neutral-400 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Cancel
                          </button>
                        }
                        @if (apt.status === 'declined' || apt.status === 'cancelled' || apt.status === 'completed') {
                          <span class="text-neutral-400 text-[10px] uppercase font-bold">Resolved</span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
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
