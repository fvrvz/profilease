import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, required } from '@angular/forms/signals';
import { DayAvailability, WeekDay } from '@profilease/types';
import { ClientAuthService } from '@service/client-auth.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';

@Component({
  selector: 'app-portal-availability',
  imports: [
    CommonModule,
    FormField,
    SharpButtonComponent,
  ],
  templateUrl: './portal-availability.component.html',
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
