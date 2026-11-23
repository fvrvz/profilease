import { Component, input, signal, computed, effect, inject } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { UserProfile, ServiceItem, AppointmentBooking } from '@profilease/types';
import { AppointmentService } from '../../../core/services/appointment.service';
import { SharpButtonComponent } from '../../../shared/components/sharp-button.component';
import { SharpIconComponent } from '../../../shared/components/sharp-icon.component';

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
  template: `
    <div id="booking-section" class="bg-white border-2 border-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8">
      <!-- Header -->
      <div class="border-b-2 border-neutral-900 pb-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-block w-2.5 h-2.5 bg-neutral-900"></span>
            <span class="text-xs font-mono font-bold tracking-widest uppercase text-neutral-500">Live Scheduling Engine</span>
          </div>
          <h2 class="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-900">
            Book Appointment
          </h2>
        </div>

        <!-- Step Indicator -->
        <div class="flex items-center gap-1.5 text-xs font-mono uppercase">
          <span
            class="px-2.5 py-1 border border-neutral-900"
            [class.bg-neutral-900]="step() === 1"
            [class.text-white]="step() === 1"
            [class.bg-neutral-100]="step() !== 1"
          >01 Service</span>
          <span class="text-neutral-400">/</span>
          <span
            class="px-2.5 py-1 border border-neutral-900"
            [class.bg-neutral-900]="step() === 2"
            [class.text-white]="step() === 2"
            [class.bg-neutral-100]="step() !== 2"
          >02 Slot</span>
          <span class="text-neutral-400">/</span>
          <span
            class="px-2.5 py-1 border border-neutral-900"
            [class.bg-neutral-900]="step() === 3"
            [class.text-white]="step() === 3"
            [class.bg-neutral-100]="step() !== 3"
          >03 Details</span>
          <span class="text-neutral-400">/</span>
          <span
            class="px-2.5 py-1 border border-neutral-900"
            [class.bg-emerald-600]="step() === 4"
            [class.text-white]="step() === 4"
            [class.bg-neutral-100]="step() !== 4"
          >04 Confirmed</span>
        </div>
      </div>

      <!-- STEP 1: Select Service & Date -->
      @if (step() === 1) {
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-800 mb-3 flex items-center gap-2">
            <app-sharp-icon name="briefcase" customClass="w-4 h-4 text-neutral-700" />
            1. Select Consultation or Service
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            @for (srv of profile().services; track srv.id) {
              <div
                (click)="selectedServiceId.set(srv.id)"
                class="p-4 border-2 transition-all cursor-pointer select-none"
                [class.border-neutral-900]="selectedServiceId() === srv.id"
                [class.bg-neutral-900]="selectedServiceId() === srv.id"
                [class.text-white]="selectedServiceId() === srv.id"
                [class.border-neutral-200]="selectedServiceId() !== srv.id"
                [class.hover:border-neutral-400]="selectedServiceId() !== srv.id"
              >
                <div class="flex items-start justify-between gap-2 mb-1">
                  <span class="font-bold text-sm uppercase">{{ srv.title }}</span>
                  <span
                    class="font-mono font-bold text-xs px-2 py-0.5 border"
                    [class.border-white]="selectedServiceId() === srv.id"
                    [class.border-neutral-900]="selectedServiceId() !== srv.id"
                    [class.bg-white]="selectedServiceId() !== srv.id"
                    [class.text-neutral-900]="selectedServiceId() !== srv.id"
                  >\${{ srv.price }}</span>
                </div>
                <p class="text-xs line-clamp-2 opacity-80 mb-2">{{ srv.description }}</p>
                <div class="flex items-center gap-3 text-[11px] font-mono">
                  <span class="flex items-center gap-1">
                    <app-sharp-icon name="clock" customClass="w-3 h-3" />
                    {{ srv.durationMinutes }} min
                  </span>
                  <span class="opacity-60">• {{ srv.category }}</span>
                </div>
              </div>
            }
          </div>

          <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-800 mb-3 flex items-center gap-2">
            <app-sharp-icon name="calendar" customClass="w-4 h-4 text-neutral-700" />
            2. Choose Date
          </h3>

          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-6">
            @for (opt of availableDates(); track opt.dateString) {
              <button
                type="button"
                [disabled]="!opt.enabled"
                (click)="selectDate(opt.dateString)"
                class="p-2.5 text-center border transition-all cursor-pointer select-none disabled:opacity-30 disabled:cursor-not-allowed"
                [class.border-neutral-900]="selectedDate() === opt.dateString"
                [class.bg-neutral-900]="selectedDate() === opt.dateString"
                [class.text-white]="selectedDate() === opt.dateString"
                [class.border-neutral-200]="selectedDate() !== opt.dateString && opt.enabled"
                [class.hover:border-neutral-900]="selectedDate() !== opt.dateString && opt.enabled"
              >
                <div class="text-[10px] font-mono uppercase opacity-75">{{ opt.dayName.slice(0, 3) }}</div>
                <div class="text-xs font-bold font-mono mt-0.5">{{ opt.displayMonthDay }}</div>
              </button>
            }
          </div>

          <div class="flex justify-end pt-4 border-t border-neutral-200">
            <app-sharp-button
              variant="primary"
              [disabled]="!selectedServiceId() || !selectedDate()"
              (btnClick)="goToStep(2)"
            >
              Continue to Time Slots →
            </app-sharp-button>
          </div>
        </div>
      }

      <!-- STEP 2: Pick Time Slot -->
      @if (step() === 2) {
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
              <app-sharp-icon name="clock" customClass="w-4 h-4 text-neutral-700" />
              Available Slots for {{ selectedDateDisplay() }}
            </h3>
            <button
              type="button"
              (click)="goToStep(1)"
              class="text-xs font-mono underline hover:text-neutral-600"
            >
              ← Change Date or Service
            </button>
          </div>

          @if (availableTimeSlots().length === 0) {
            <div class="p-8 text-center border-2 border-dashed border-neutral-300 text-neutral-500 font-mono text-xs">
              No available appointment slots on this date. Please pick another date.
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-6">
              @for (slot of availableTimeSlots(); track slot) {
                <button
                  type="button"
                  (click)="selectedTimeSlot.set(slot)"
                  class="p-3 text-center border-2 font-mono text-xs font-bold transition-all cursor-pointer select-none"
                  [class.border-neutral-900]="selectedTimeSlot() === slot"
                  [class.bg-neutral-900]="selectedTimeSlot() === slot"
                  [class.text-white]="selectedTimeSlot() === slot"
                  [class.border-neutral-200]="selectedTimeSlot() !== slot"
                  [class.hover:border-neutral-900]="selectedTimeSlot() !== slot"
                >
                  {{ slot }}
                </button>
              }
            </div>
          }

          <div class="flex items-center justify-between pt-4 border-t border-neutral-200">
            <app-sharp-button variant="secondary" (btnClick)="goToStep(1)">
              ← Back
            </app-sharp-button>
            <app-sharp-button
              variant="primary"
              [disabled]="!selectedTimeSlot()"
              (btnClick)="goToStep(3)"
            >
              Enter Patient / Client Info →
            </app-sharp-button>
          </div>
        </div>
      }

      <!-- STEP 3: Client Info & Signal Form -->
      @if (step() === 3) {
        <div>
          <!-- Booking summary banner -->
          <div class="bg-neutral-100 border border-neutral-300 p-4 mb-6 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div>
              <span class="text-neutral-500 uppercase">Service:</span>
              <strong class="ml-1 uppercase text-neutral-900">{{ selectedService()?.title }}</strong>
            </div>
            <div>
              <span class="text-neutral-500 uppercase">Date & Time:</span>
              <strong class="ml-1 text-neutral-900">{{ selectedDate() }} at {{ selectedTimeSlot() }}</strong>
            </div>
            <div>
              <span class="text-neutral-500 uppercase">Fee:</span>
              <strong class="ml-1 text-neutral-900">\${{ selectedService()?.price }}</strong>
            </div>
          </div>

          <form (submit)="onSubmitBooking($event)" novalidate class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Full Name -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  [formField]="bookingForm.clientName"
                  placeholder="e.g. Johnathan Doe"
                  class="w-full px-3 py-2.5 bg-white border border-neutral-300 text-neutral-900 text-xs font-mono focus:border-neutral-900 focus:outline-none"
                />
                @if (bookingForm.clientName().invalid() && bookingForm.clientName().touched()) {
                  <p class="text-[11px] text-red-600 font-mono mt-1">
                    {{ bookingForm.clientName().errors()[0]?.message || 'Full Name is required' }}
                  </p>
                }
              </div>

              <!-- Email Address -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  [formField]="bookingForm.clientEmail"
                  placeholder="name@example.com"
                  class="w-full px-3 py-2.5 bg-white border border-neutral-300 text-neutral-900 text-xs font-mono focus:border-neutral-900 focus:outline-none"
                />
                @if (bookingForm.clientEmail().invalid() && bookingForm.clientEmail().touched()) {
                  <p class="text-[11px] text-red-600 font-mono mt-1">
                    {{ bookingForm.clientEmail().errors()[0]?.message || 'Valid email is required' }}
                  </p>
                }
              </div>
            </div>

            <!-- Phone Number -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                [formField]="bookingForm.clientPhone"
                placeholder="+1 (555) 000-0000"
                class="w-full px-3 py-2.5 bg-white border border-neutral-300 text-neutral-900 text-xs font-mono focus:border-neutral-900 focus:outline-none"
              />
              @if (bookingForm.clientPhone().invalid() && bookingForm.clientPhone().touched()) {
                <p class="text-[11px] text-red-600 font-mono mt-1">
                  {{ bookingForm.clientPhone().errors()[0]?.message || 'Phone number is required' }}
                </p>
              }
            </div>

            <!-- Reason / Consultation Notes -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Reason for Visit / Specific Inquiries
              </label>
              <textarea
                [formField]="bookingForm.notes"
                rows="3"
                placeholder="Briefly state symptoms, topic, questions, or goals..."
                class="w-full px-3 py-2.5 bg-white border border-neutral-300 text-neutral-900 text-xs font-mono focus:border-neutral-900 focus:outline-none"
              ></textarea>
            </div>

            @if (appointmentService.errorMessage()) {
              <div class="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-mono">
                {{ appointmentService.errorMessage() }}
              </div>
            }

            <div class="flex items-center justify-between pt-4 border-t border-neutral-200">
              <app-sharp-button variant="secondary" (btnClick)="goToStep(2)">
                ← Back
              </app-sharp-button>
              <app-sharp-button
                variant="primary"
                type="submit"
                [loading]="appointmentService.isSubmitting()"
                [disabled]="bookingForm().invalid()"
              >
                Confirm Appointment →
              </app-sharp-button>
            </div>
          </form>
        </div>
      }

      <!-- STEP 4: Confirmation Ticket -->
      @if (step() === 4 && confirmedBooking()) {
        <div class="text-center py-6">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 text-emerald-800 border-2 border-emerald-800 mb-4">
            <app-sharp-icon name="check" customClass="w-8 h-8" />
          </div>

          <span class="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-mono uppercase tracking-widest font-bold mb-2">
            Appointment Requested & Logged
          </span>

          <h3 class="text-2xl font-black uppercase tracking-tight text-neutral-900 mb-2">
            You're All Set, {{ confirmedBooking()?.clientName }}!
          </h3>
          <p class="text-xs text-neutral-600 max-w-md mx-auto mb-6">
            A real-time confirmation receipt has been dispatched to your email (<strong>{{ confirmedBooking()?.clientEmail }}</strong>) and WhatsApp. The practitioner has received an instant 1-click notification alert.
          </p>

          <!-- Sharp Ticket Box -->
          <div class="max-w-md mx-auto bg-neutral-50 border-2 border-neutral-900 p-5 text-left font-mono text-xs mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div class="border-b border-neutral-300 pb-3 mb-3 flex items-center justify-between">
              <span class="text-neutral-500 uppercase text-[10px]">Reference Code</span>
              <span class="font-bold text-neutral-900">{{ confirmedBooking()?.id }}</span>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span class="text-neutral-500 uppercase text-[10px] block">Provider</span>
                <span class="font-bold text-neutral-900">{{ profile().name }}</span>
              </div>
              <div>
                <span class="text-neutral-500 uppercase text-[10px] block">Service</span>
                <span class="font-bold text-neutral-900">{{ confirmedBooking()?.serviceTitle }}</span>
              </div>
              <div>
                <span class="text-neutral-500 uppercase text-[10px] block">Date</span>
                <span class="font-bold text-neutral-900">{{ confirmedBooking()?.appointmentDate }}</span>
              </div>
              <div>
                <span class="text-neutral-500 uppercase text-[10px] block">Time Slot</span>
                <span class="font-bold text-neutral-900">{{ confirmedBooking()?.appointmentTime }}</span>
              </div>
            </div>
            <div class="border-t border-neutral-300 pt-3">
              <span class="text-neutral-500 uppercase text-[10px] block">Location / Mode</span>
              <span class="text-neutral-800">{{ profile().location }}</span>
            </div>
          </div>

          <div class="flex justify-center gap-3">
            <app-sharp-button variant="outline" (btnClick)="resetBooking()">
              Schedule Another
            </app-sharp-button>
          </div>
        </div>
      }
    </div>
  `,
})
export class BookingWidgetComponent {
  readonly profile = input.required<UserProfile>();
  readonly preselectedServiceId = input<string>();

  protected readonly appointmentService = inject(AppointmentService);

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
      const dayConfig = prof.availability.find((a) => a.day === dayOfWeekName);
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

    const config = this.profile().availability.find((a) => a.day === currentDay);
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
