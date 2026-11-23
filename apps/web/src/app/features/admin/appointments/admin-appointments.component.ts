import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { AppointmentBooking, AppointmentStatus } from '@profilease/types';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ProfileService } from '../../../core/services/profile.service';
import { SharpBadgeComponent } from '../../../shared/components/sharp-badge.component';

@Component({
  selector: 'app-admin-appointments',
  imports: [
    SharpBadgeComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Title & Filters Bar -->
      <div class="border-b-2 border-neutral-900 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-neutral-500 block">
            Central Booking Control
          </span>
          <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
            Client Appointments
          </h1>
        </div>

        <!-- Filter Tabs -->
        <div class="flex items-center gap-1 font-mono text-xs uppercase">
          @for (tab of statusTabs; track tab.key) {
            <button
              type="button"
              (click)="activeStatusFilter.set(tab.key)"
              class="px-3 py-1.5 border border-neutral-900 transition-colors cursor-pointer"
              [class.bg-neutral-900]="activeStatusFilter() === tab.key"
              [class.text-white]="activeStatusFilter() === tab.key"
              [class.bg-white]="activeStatusFilter() !== tab.key"
            >
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      <!-- Main Appointments Table -->
      <div class="bg-white border-2 border-neutral-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div class="px-6 py-4 border-b-2 border-neutral-900 flex items-center justify-between bg-neutral-50">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-neutral-900"></span>
            <h2 class="text-xs font-mono font-bold uppercase tracking-widest text-neutral-900">
              Filtered Bookings ({{ filteredAppointments().length }})
            </h2>
          </div>
          <span class="text-xs font-mono text-neutral-500">Real-Time Scheduling</span>
        </div>

        @if (filteredAppointments().length === 0) {
          <div class="p-12 text-center font-mono text-xs text-neutral-500">
            No appointments found matching current filter criteria.
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr class="border-b border-neutral-200 bg-neutral-100/70 text-neutral-700 uppercase tracking-wider text-[11px]">
                  <th class="py-3 px-4">Ref Code</th>
                  <th class="py-3 px-4">Client Details</th>
                  <th class="py-3 px-4">Provider</th>
                  <th class="py-3 px-4">Service</th>
                  <th class="py-3 px-4">Scheduled Slot</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200">
                @for (apt of filteredAppointments(); track apt.id) {
                  <tr class="hover:bg-neutral-50/80 transition-colors">
                    <td class="py-3.5 px-4 font-bold text-neutral-900">
                      {{ apt.id }}
                    </td>
                    <td class="py-3.5 px-4">
                      <strong class="text-neutral-900 block">{{ apt.clientName }}</strong>
                      <span class="text-neutral-500 block text-[10px]">{{ apt.clientEmail }}</span>
                      <span class="text-neutral-500 block text-[10px]">{{ apt.clientPhone }}</span>
                      @if (apt.notes) {
                        <div class="text-[10px] text-neutral-600 mt-1 italic border-l border-neutral-300 pl-1.5">
                          "{{ apt.notes }}"
                        </div>
                      }
                    </td>
                    <td class="py-3.5 px-4 font-bold text-neutral-800">
                      {{ getProviderName(apt.profileId) }}
                    </td>
                    <td class="py-3.5 px-4">
                      {{ apt.serviceTitle }}
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="font-bold text-neutral-900 block">{{ apt.appointmentDate }}</span>
                      <span class="text-neutral-500 text-[10px]">{{ apt.appointmentTime }}</span>
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
                            class="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase hover:bg-emerald-700 border border-emerald-700 cursor-pointer"
                          >
                            Confirm
                          </button>
                        }
                        @if (apt.status === 'confirmed') {
                          <button
                            type="button"
                            (click)="updateStatus(apt.id, 'completed')"
                            class="px-2 py-1 bg-neutral-900 text-white text-[10px] font-bold uppercase hover:bg-neutral-800 border border-neutral-900 cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        }
                        @if (apt.status !== 'cancelled' && apt.status !== 'completed') {
                          <button
                            type="button"
                            (click)="updateStatus(apt.id, 'cancelled')"
                            class="px-2 py-1 bg-neutral-200 text-neutral-800 text-[10px] font-bold uppercase hover:bg-neutral-300 border border-neutral-400 cursor-pointer"
                          >
                            Cancel
                          </button>
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
export class AdminAppointmentsComponent implements OnInit {
  protected readonly appointmentService = inject(AppointmentService);
  protected readonly profileService = inject(ProfileService);

  readonly activeStatusFilter = signal<string>('all');

  readonly statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  readonly filteredAppointments = computed<readonly AppointmentBooking[]>(() => {
    const list = this.appointmentService.appointments();
    const filter = this.activeStatusFilter();
    if (filter === 'all') return list;
    return list.filter((a) => a.status === filter);
  });

  ngOnInit(): void {
    this.appointmentService.loadAll().subscribe();
    this.profileService.loadAll().subscribe();
  }

  getProviderName(profileId: string): string {
    const p = this.profileService.profiles().find((prof) => prof.id === profileId);
    return p ? p.name : profileId;
  }

  updateStatus(id: string, status: AppointmentStatus): void {
    this.appointmentService.updateStatus(id, status).subscribe();
  }

  getStatusBadge(status: string): 'green' | 'amber' | 'red' | 'neutral' {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'green';
      case 'pending':
        return 'amber';
      case 'cancelled':
        return 'red';
      default:
        return 'neutral';
    }
  }
}
