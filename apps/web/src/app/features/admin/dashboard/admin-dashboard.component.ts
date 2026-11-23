import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppointmentStatus } from '@profilease/types';
import { ProfileService } from '../../../core/services/profile.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { SharpBadgeComponent } from '../../../shared/components/sharp-badge.component';
import { SharpIconComponent } from '../../../shared/components/sharp-icon.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    RouterLink,
    SharpBadgeComponent,
    SharpIconComponent,
  ],
  template: `
    <div class="space-y-8">
      <!-- Title & Action Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-neutral-900 pb-5">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-neutral-500 block">System Overview</span>
          <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
            Professional Profiles & Bookings
          </h1>
        </div>

        <div class="flex items-center gap-3">
          <a
            routerLink="/admin/onboard"
            class="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider border-2 border-neutral-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <app-sharp-icon name="plus" customClass="w-3.5 h-3.5" />
            <span>Onboard New Client</span>
          </a>
        </div>
      </div>

      <!-- KPI METRIC TILES -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Total Profiles -->
        <div class="bg-white border-2 border-neutral-900 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 block mb-1">
            Total Profiles
          </span>
          <div class="text-3xl font-black text-neutral-900 font-mono">
            {{ profileService.profiles().length }}
          </div>
          <span class="text-[11px] font-mono text-neutral-500 mt-2 block">
            Doctors, Teachers & Coaches
          </span>
        </div>

        <!-- Custom Domains -->
        <div class="bg-white border-2 border-neutral-900 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 block mb-1">
            Custom Domains
          </span>
          <div class="text-3xl font-black text-neutral-900 font-mono">
            {{ customDomainsCount() }}
          </div>
          <span class="text-[11px] font-mono text-neutral-500 mt-2 block">
            Independent Host Mappings
          </span>
        </div>

        <!-- Total Bookings -->
        <div class="bg-white border-2 border-neutral-900 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 block mb-1">
            Total Bookings
          </span>
          <div class="text-3xl font-black text-neutral-900 font-mono">
            {{ appointmentService.appointments().length }}
          </div>
          <span class="text-[11px] font-mono text-neutral-500 mt-2 block">
            Logged Client Consultations
          </span>
        </div>

        <!-- Pending Bookings -->
        <div class="bg-white border-2 border-neutral-900 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 block mb-1">
            Pending Actions
          </span>
          <div class="text-3xl font-black text-amber-600 font-mono">
            {{ pendingBookingsCount() }}
          </div>
          <span class="text-[11px] font-mono text-neutral-500 mt-2 block">
            Requires Confirmation
          </span>
        </div>
      </div>

      <!-- ONBOARDED CLIENT PROFILES TABLE -->
      <div class="bg-white border-2 border-neutral-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div class="px-6 py-4 border-b-2 border-neutral-900 flex items-center justify-between bg-neutral-50">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-neutral-900"></span>
            <h2 class="text-xs font-mono font-bold uppercase tracking-widest text-neutral-900">
              Active Client Profiles Directory
            </h2>
          </div>
          <span class="text-xs font-mono text-neutral-500">
            {{ profileService.profiles().length }} Profiles Managed
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr class="border-b border-neutral-200 bg-neutral-100/70 text-neutral-700 uppercase tracking-wider text-[11px]">
                <th class="py-3 px-4">Practitioner / Client</th>
                <th class="py-3 px-4">Profession</th>
                <th class="py-3 px-4">Slug / Route</th>
                <th class="py-3 px-4">Custom Domain</th>
                <th class="py-3 px-4">Services</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200">
              @for (prof of profileService.profiles(); track prof.id) {
                <tr class="hover:bg-neutral-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-neutral-900">
                    <div class="flex items-center gap-3">
                      <img
                        [src]="prof.avatarUrl"
                        [alt]="prof.name"
                        class="w-8 h-8 object-cover border border-neutral-900 grayscale"
                      />
                      <div>
                        <span class="block">{{ prof.name }}</span>
                        <span class="text-[10px] text-neutral-500 font-normal">{{ prof.clinicOrSchoolName }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-4">
                    <app-sharp-badge [variant]="getProfessionBadge(prof.profession)">
                      {{ prof.profession }}
                    </app-sharp-badge>
                  </td>
                  <td class="py-3.5 px-4">
                    <a
                      [routerLink]="['/@' + prof.slug]"
                      target="_blank"
                      class="text-neutral-900 underline hover:text-neutral-600 font-bold"
                    >
                      /&#64;{{ prof.slug }}
                    </a>
                  </td>
                  <td class="py-3.5 px-4">
                    @if (prof.customDomain) {
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-800 text-[10px]">
                        <app-sharp-icon name="globe" customClass="w-3 h-3 text-neutral-500" />
                        {{ prof.customDomain }}
                      </span>
                    } @else {
                      <span class="text-neutral-400 italic">None (Sub-path only)</span>
                    }
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="font-bold">{{ prof.services.length }}</span> items
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <div class="inline-flex items-center gap-2">
                      <a
                        [routerLink]="['/@' + prof.slug]"
                        target="_blank"
                        class="px-2.5 py-1 bg-white hover:bg-neutral-900 hover:text-white text-neutral-900 border border-neutral-900 uppercase text-[10px] font-bold transition-colors"
                      >
                        Preview
                      </a>
                      <button
                        type="button"
                        (click)="deleteProfile(prof.id)"
                        class="px-2.5 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 border border-red-300 uppercase text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- RECENT APPOINTMENT REQUESTS -->
      <div class="bg-white border-2 border-neutral-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div class="px-6 py-4 border-b-2 border-neutral-900 flex items-center justify-between bg-neutral-50">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-neutral-900"></span>
            <h2 class="text-xs font-mono font-bold uppercase tracking-widest text-neutral-900">
              Incoming Appointment Bookings
            </h2>
          </div>
          <a routerLink="/admin/appointments" class="text-xs font-mono font-bold uppercase underline hover:text-neutral-600">
            View All Bookings →
          </a>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr class="border-b border-neutral-200 bg-neutral-100/70 text-neutral-700 uppercase tracking-wider text-[11px]">
                <th class="py-3 px-4">Client / Patient</th>
                <th class="py-3 px-4">Contact</th>
                <th class="py-3 px-4">Service</th>
                <th class="py-3 px-4">Date & Time</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200">
              @for (apt of appointmentService.appointments().slice(0, 5); track apt.id) {
                <tr class="hover:bg-neutral-50/80 transition-colors">
                  <td class="py-3 px-4">
                    <strong class="text-neutral-900 block">{{ apt.clientName }}</strong>
                    @if (apt.notes) {
                      <span class="text-[10px] text-neutral-500 line-clamp-1">"{{ apt.notes }}"</span>
                    }
                  </td>
                  <td class="py-3 px-4 text-neutral-600">
                    <div>{{ apt.clientEmail }}</div>
                    <div class="text-[10px] text-neutral-500">{{ apt.clientPhone }}</div>
                  </td>
                  <td class="py-3 px-4 font-bold text-neutral-800">
                    {{ apt.serviceTitle }}
                  </td>
                  <td class="py-3 px-4">
                    <span class="font-bold text-neutral-900">{{ apt.appointmentDate }}</span>
                    <span class="text-neutral-500 block text-[10px]">{{ apt.appointmentTime }}</span>
                  </td>
                  <td class="py-3 px-4">
                    <app-sharp-badge [variant]="getStatusBadge(apt.status)">
                      {{ apt.status }}
                    </app-sharp-badge>
                  </td>
                  <td class="py-3 px-4 text-right">
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
                      @if (apt.status !== 'cancelled') {
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
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  protected readonly profileService = inject(ProfileService);
  protected readonly appointmentService = inject(AppointmentService);

  readonly customDomainsCount = computed(() => {
    return this.profileService.profiles().filter((p) => !!p.customDomain).length;
  });

  readonly pendingBookingsCount = computed(() => {
    return this.appointmentService.appointments().filter((a) => a.status === 'pending').length;
  });

  ngOnInit(): void {
    this.profileService.loadAll().subscribe();
    this.appointmentService.loadAll().subscribe();
  }

  deleteProfile(id: string): void {
    if (confirm('Are you sure you want to delete this client profile?')) {
      this.profileService.delete(id).subscribe();
    }
  }

  updateStatus(id: string, status: AppointmentStatus): void {
    this.appointmentService.updateStatus(id, status).subscribe();
  }

  getProfessionBadge(profession: string): 'teal' | 'indigo' | 'amber' | 'neutral' {
    switch (profession) {
      case 'doctor':
        return 'teal';
      case 'teacher':
        return 'indigo';
      case 'coach':
      case 'therapist':
        return 'amber';
      default:
        return 'neutral';
    }
  }

  getStatusBadge(status: string): 'green' | 'amber' | 'red' | 'neutral' {
    switch (status) {
      case 'confirmed':
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
