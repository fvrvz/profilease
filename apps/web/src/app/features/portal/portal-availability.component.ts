import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, required } from '@angular/forms/signals';
import { DayAvailability, WeekDay } from '@profilease/types';
import { ClientAuthService } from '@service/client-auth.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-portal-availability',
  imports: [
    CommonModule,
    FormField,
    SharpButtonComponent,
    SharpIconComponent,
  ],
  template: `
    <div class="space-y-8 font-sans">
      <!-- Title Header -->
      <div class="border-b-2 border-neutral-900 pb-4">
        <span class="text-xs font-mono uppercase tracking-widest text-neutral-500 block">Schedules & Geographics</span>
        <h1 class="text-2xl font-black uppercase tracking-tight text-neutral-900">
          Timings, Availability, Country & Currency
        </h1>
        <p class="text-xs text-neutral-600 mt-1 font-mono">
          Configure your operating timezone, client billing currency, and weekly appointment booking window.
        </p>
      </div>

      <!-- Regional & Currency Settings Form -->
      <div class="bg-white border-2 border-neutral-900 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div class="flex items-center gap-2 mb-4 border-b border-neutral-200 pb-3">
          <span class="w-2.5 h-2.5 bg-neutral-900"></span>
          <h2 class="text-xs font-mono font-bold uppercase tracking-widest text-neutral-900">
            Regional Parameters & Currency
          </h2>
        </div>

        <form (submit)="onSaveRegional($event)" novalidate class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Country -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Country *
              </label>
              <input
                type="text"
                [formField]="regionalForm.country"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
                placeholder="e.g. United States"
              />
            </div>

            <!-- Currency -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Billing Currency *
              </label>
              <select
                [formField]="regionalForm.currency"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
              >
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="CAD">CAD ($ - Canadian Dollar)</option>
                <option value="AUD">AUD ($ - Australian Dollar)</option>
                <option value="INR">INR (₹ - Indian Rupee)</option>
              </select>
            </div>

            <!-- Timezone -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Operating Timezone *
              </label>
              <input
                type="text"
                [formField]="regionalForm.timezone"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
                placeholder="e.g. America/New_York"
              />
            </div>
          </div>

          <!-- Timings Note -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
              General Timings / Operating Notice
            </label>
            <input
              type="text"
              [formField]="regionalForm.timingsNote"
              class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
              placeholder="e.g. Mon-Fri: 09:00 - 17:00 EST. Emergency triage on call."
            />
          </div>

          <div class="flex items-center justify-between pt-2">
            @if (saveSuccess()) {
              <span class="text-xs font-mono font-bold text-emerald-600">
                ✓ Regional settings saved successfully!
              </span>
            } @else {
              <span></span>
            }

            <app-sharp-button type="submit" variant="primary">
              Update Regional Configuration
            </app-sharp-button>
          </div>
        </form>
      </div>

      <!-- Weekly Schedule Configuration -->
      <div class="bg-white border-2 border-neutral-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div class="px-6 py-4 border-b-2 border-neutral-900 flex items-center justify-between bg-neutral-50">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-neutral-900"></span>
            <h2 class="text-xs font-mono font-bold uppercase tracking-widest text-neutral-900">
              Weekly Consultation Hours & Slot Interval
            </h2>
          </div>
          <button
            type="button"
            (click)="saveAvailabilitySchedule()"
            class="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono font-bold uppercase tracking-wider border border-neutral-900 cursor-pointer"
          >
            Save Weekly Schedule
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr class="border-b border-neutral-200 bg-neutral-100/70 text-neutral-700 uppercase tracking-wider text-[11px]">
                <th class="py-3 px-4">Day of Week</th>
                <th class="py-3 px-4">Accept Bookings</th>
                <th class="py-3 px-4">Start Time</th>
                <th class="py-3 px-4">End Time</th>
                <th class="py-3 px-4">Slot Duration</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200">
              @for (day of weeklySchedule(); track day.day; let i = $index) {
                <tr [class]="day.enabled ? 'hover:bg-neutral-50/80 transition-colors' : 'bg-neutral-50/50 text-neutral-400'">
                  <td class="py-3 px-4 font-bold text-sm text-neutral-900">
                    {{ day.day }}
                  </td>
                  <td class="py-3 px-4">
                    <label class="inline-flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        [checked]="day.enabled"
                        (change)="toggleDay(i)"
                        class="w-4 h-4 border-2 border-neutral-900 cursor-pointer"
                      />
                      <span>{{ day.enabled ? 'Active' : 'Off' }}</span>
                    </label>
                  </td>
                  <td class="py-3 px-4">
                    <input
                      type="time"
                      [value]="day.startTime"
                      [disabled]="!day.enabled"
                      (change)="updateDayTime(i, 'startTime', $event)"
                      class="px-2 py-1 border border-neutral-900 bg-white font-mono text-xs disabled:opacity-40"
                    />
                  </td>
                  <td class="py-3 px-4">
                    <input
                      type="time"
                      [value]="day.endTime"
                      [disabled]="!day.enabled"
                      (change)="updateDayTime(i, 'endTime', $event)"
                      class="px-2 py-1 border border-neutral-900 bg-white font-mono text-xs disabled:opacity-40"
                    />
                  </td>
                  <td class="py-3 px-4">
                    <select
                      [value]="day.slotDurationMinutes"
                      [disabled]="!day.enabled"
                      (change)="updateDayDuration(i, $event)"
                      class="px-2 py-1 border border-neutral-900 bg-white font-mono text-xs disabled:opacity-40"
                    >
                      <option [value]="15">15 mins</option>
                      <option [value]="30">30 mins</option>
                      <option [value]="45">45 mins</option>
                      <option [value]="60">60 mins</option>
                      <option [value]="90">90 mins</option>
                    </select>
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
export class PortalAvailabilityComponent implements OnInit {
  private readonly clientAuth = inject(ClientAuthService);

  readonly currentProfile = this.clientAuth.currentProfile;
  readonly saveSuccess = signal<boolean>(false);

  readonly regionalState = signal({
    country: 'United States',
    currency: 'USD',
    timezone: 'America/New_York',
    timingsNote: 'Monday - Friday: 09:00 - 17:00 EST',
  });

  readonly regionalForm = form(this.regionalState, (schema) => {
    required(schema.country, { message: 'Country is required' });
    required(schema.currency, { message: 'Currency is required' });
    required(schema.timezone, { message: 'Timezone is required' });
  });

  readonly weeklySchedule = signal<DayAvailability[]>([]);

  ngOnInit(): void {
    const p = this.currentProfile();
    if (p) {
      this.regionalState.set({
        country: p.country || 'United States',
        currency: p.currency || 'USD',
        timezone: p.timezone || 'America/New_York',
        timingsNote: p.timingsNote || '',
      });

      if (p.availability && p.availability.length > 0) {
        this.weeklySchedule.set([...p.availability]);
      } else {
        const days: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        this.weeklySchedule.set(
          days.map((d) => ({
            day: d,
            enabled: d !== 'Saturday' && d !== 'Sunday',
            startTime: '09:00',
            endTime: '17:00',
            slotDurationMinutes: 30,
          }))
        );
      }
    }
  }

  onSaveRegional(event: Event): void {
    event.preventDefault();
    const val = this.regionalState();
    this.clientAuth
      .updateProfile({
        country: val.country,
        currency: val.currency,
        timezone: val.timezone,
        timingsNote: val.timingsNote,
      })
      .subscribe({
        next: () => {
          this.saveSuccess.set(true);
          setTimeout(() => this.saveSuccess.set(false), 3000);
        },
      });
  }

  toggleDay(index: number): void {
    const list = [...this.weeklySchedule()];
    list[index] = { ...list[index], enabled: !list[index].enabled };
    this.weeklySchedule.set(list);
  }

  updateDayTime(index: number, key: 'startTime' | 'endTime', event: Event): void {
    const target = event.target as HTMLInputElement;
    const list = [...this.weeklySchedule()];
    list[index] = { ...list[index], [key]: target.value };
    this.weeklySchedule.set(list);
  }

  updateDayDuration(index: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const list = [...this.weeklySchedule()];
    list[index] = { ...list[index], slotDurationMinutes: Number(target.value) || 30 };
    this.weeklySchedule.set(list);
  }

  saveAvailabilitySchedule(): void {
    this.clientAuth.updateProfile({ availability: this.weeklySchedule() }).subscribe({
      next: () => {
        alert('Weekly consultation schedule saved successfully!');
      },
    });
  }
}
