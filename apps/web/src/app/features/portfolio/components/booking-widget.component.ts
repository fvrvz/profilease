import { Component, input, signal, computed, effect, inject } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { UserProfile, ServiceItem, AppointmentBooking } from '@profilease/types';
import { AppointmentService } from '@service/appointment.service';
import { CurrencyService } from '@service/currency.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

interface DateOption {
  readonly dateString: string; // YYYY-MM-DD
  readonly dayName: string;   // e.g. "Monday"
  readonly displayMonthDay: string; // e.g. "Nov 26"
  readonly enabled: boolean;
}

@Component({
  selector: 'app-booking-widget',
  imports: [
    FormField,
    SharpButtonComponent,
    SharpIconComponent,
  ],
  host: {
    class: 'block my-8',
  },
  templateUrl: './booking-widget.component.html',
})
export class BookingWidgetComponent {
  readonly profile = input.required<UserProfile>();
  readonly preselectedServiceId = input<string>();

  protected readonly appointmentService = inject(AppointmentService);
  protected readonly currencyService = inject(CurrencyService);

  readonly step = signal<number>(1);
  readonly selectedServiceId = signal<string>('');
  readonly selectedDate = signal<string>('');
  readonly selectedTimeSlot = signal<string>('');
  readonly confirmedBooking = signal<AppointmentBooking | null>(null);

  // Signal Form for client intake
  readonly bookingModel = signal({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
  });

  readonly bookingForm = form(this.bookingModel, (schema) => {
    required(schema.clientName, { message: 'Full Name is required' });
    required(schema.clientEmail, { message: 'Email is required' });
    email(schema.clientEmail, { message: 'Must be a valid email address' });
    required(schema.clientPhone, { message: 'Phone number is required' });
  });

  constructor() {
    effect(() => {
      const pre = this.preselectedServiceId();
      if (pre) {
        this.selectedServiceId.set(pre);
      } else if (this.profile().services.length > 0 && !this.selectedServiceId()) {
        this.selectedServiceId.set(this.profile().services[0].id);
      }
    });
  }

  // Next 14 days availability
  readonly availableDates = computed<readonly DateOption[]>(() => {
    const dates: DateOption[] = [];
    const prof = this.profile();
    const today = new Date();

    const dayMap: Record<number, 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'> = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
    };

    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const dayOfWeekName = dayMap[d.getDay()];
      const dayConfig = (prof.availability || []).find(
        (a) => (a.day || (a as { dayOfWeek?: string }).dayOfWeek || '').toLowerCase() === dayOfWeekName.toLowerCase()
      );
      const isEnabled = dayConfig ? dayConfig.enabled : false;

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      const monthName = d.toLocaleString('en-US', { month: 'short' });
      const displayMonthDay = `${monthName} ${d.getDate()}`;

      dates.push({
        dateString,
        dayName: dayOfWeekName,
        displayMonthDay,
        enabled: isEnabled,
      });
    }

    return dates;
  });

  readonly selectedService = computed<ServiceItem | undefined>(() => {
    const id = this.selectedServiceId();
    return this.profile().services.find((s) => s.id === id);
  });

  readonly selectedDateDisplay = computed<string>(() => {
    const dStr = this.selectedDate();
    if (!dStr) return '';
    const d = new Date(dStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  });

  readonly availableTimeSlots = computed<readonly string[]>(() => {
    const dStr = this.selectedDate();
    if (!dStr) return [];

    const d = new Date(dStr + 'T00:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[d.getDay()];

    const config = (this.profile().availability || []).find(
      (a) => (a.day || (a as { dayOfWeek?: string }).dayOfWeek || '').toLowerCase() === currentDay.toLowerCase()
    );
    if (!config || !config.enabled) return [];

    const slots: string[] = [];
    const [startH, startM] = config.startTime.split(':').map(Number);
    const [endH, endM] = config.endTime.split(':').map(Number);
    const duration = config.slotDurationMinutes || 30;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + duration <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push(timeStr);
      currentMinutes += duration;
    }

    return slots;
  });

  selectDate(d: string): void {
    this.selectedDate.set(d);
    this.selectedTimeSlot.set('');
  }

  goToStep(n: number): void {
    this.step.set(n);
  }

  onSubmitBooking(e: Event): void {
    e.preventDefault();
    if (this.bookingForm().invalid()) {
      return;
    }

    const modelVal = this.bookingModel();
    this.appointmentService
      .book({
        profileId: this.profile().id,
        serviceId: this.selectedServiceId(),
        clientName: modelVal.clientName,
        clientEmail: modelVal.clientEmail,
        clientPhone: modelVal.clientPhone,
        appointmentDate: this.selectedDate(),
        appointmentTime: this.selectedTimeSlot(),
        notes: modelVal.notes,
      })
      .subscribe({
        next: (booking) => {
          this.confirmedBooking.set(booking);
          this.step.set(4);
        },
      });
  }

  resetBooking(): void {
    this.step.set(1);
    this.selectedTimeSlot.set('');
    this.confirmedBooking.set(null);
    this.bookingModel.set({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      notes: '',
    });
  }
}
