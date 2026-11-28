import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { DayAvailability, WeekDay } from '@profilease/types';
import { ClientAuthService } from '@service/client-auth.service';
import { CurrencyService } from '@service/currency.service';
import { ToastService } from '@service/toast.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpSelectComponent, SharpSelectOption } from '@shared/components/sharp-select.component';

@Component({
  selector: 'app-portal-availability',
  imports: [
    CommonModule,
    FormField,
    SharpButtonComponent,
    SharpSelectComponent,
  ],
  templateUrl: './portal-availability.component.html',
})
export class PortalAvailabilityComponent implements OnInit {
  private readonly clientAuth = inject(ClientAuthService);
  private readonly toast = inject(ToastService);
  protected readonly currencyService = inject(CurrencyService);

  readonly currentProfile = this.clientAuth.currentProfile;
  readonly saveSuccess = signal<boolean>(false);

  readonly slotDurationOptions: readonly SharpSelectOption[] = [
    { value: '15', label: '15 mins' },
    { value: '30', label: '30 mins' },
    { value: '45', label: '45 mins' },
    { value: '60', label: '60 mins' },
    { value: '90', label: '90 mins' },
  ];

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
    void submit(this.regionalForm, async () => {
      const val = this.regionalState();
      this.toast.startLoading('Saving regional settings...');
      try {
        await firstValueFrom(
          this.clientAuth.updateProfile({
            country: val.country,
            currency: val.currency,
            timezone: val.timezone,
            timingsNote: val.timingsNote,
          })
        );
        this.saveSuccess.set(true);
        this.toast.showSuccess('Regional settings saved!');
        setTimeout(() => this.saveSuccess.set(false), 3000);
      } catch {
        this.toast.showError('Failed to save regional settings.');
      } finally {
        this.toast.stopLoading();
      }
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

  updateDurationValue(index: number, val: string): void {
    const list = [...this.weeklySchedule()];
    list[index] = { ...list[index], slotDurationMinutes: Number(val) || 30 };
    this.weeklySchedule.set(list);
  }

  onCurrencySelect(val: string): void {
    this.regionalState.update((s) => ({ ...s, currency: val }));
  }

  saveAvailabilitySchedule(): void {
    this.toast.startLoading('Saving weekly availability...');
    this.clientAuth.updateProfile({ availability: this.weeklySchedule() }).subscribe({
      next: () => {
        this.toast.stopLoading();
        this.toast.showSuccess('Weekly consultation schedule saved!');
      },
      error: () => {
        this.toast.stopLoading();
        this.toast.showError('Failed to save weekly schedule.');
      },
    });
  }
}
