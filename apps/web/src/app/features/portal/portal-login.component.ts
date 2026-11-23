import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { form, FormField, required, email } from '@angular/forms/signals';
import { ClientAuthService } from '../../core/services/client-auth.service';
import { SharpButtonComponent } from '../../shared/components/sharp-button.component';
import { SharpIconComponent } from '../../shared/components/sharp-icon.component';

@Component({
  selector: 'app-portal-login',
  imports: [
    RouterLink,
    FormField,
    SharpButtonComponent,
    SharpIconComponent,
  ],
  template: `
    <div class="min-h-screen bg-neutral-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <!-- Sharp Card Container -->
      <div class="w-full max-w-md bg-white border-2 border-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8">
        <!-- Brand / Header -->
        <div class="border-b-2 border-neutral-900 pb-5 mb-6 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-neutral-900 text-white mb-3">
            <app-sharp-icon name="user" customClass="w-6 h-6" />
          </div>
          <span class="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-1">
            Client Self-Service Portal
          </span>
          <h1 class="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
            Practitioner Dashboard
          </h1>
          <p class="text-xs text-neutral-600 mt-1">
            Manage your appointments, services, pricing, currency, and availability schedules.
          </p>
        </div>

        <!-- Quick Demo Profiles Selection -->
        <div class="bg-neutral-50 border border-neutral-300 p-3 mb-6 font-mono text-[11px] text-neutral-700">
          <div class="font-bold uppercase text-[10px] text-neutral-500 mb-2">
            Instant Demo Logins:
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              (click)="fillElenaDemo()"
              class="px-2.5 py-1.5 bg-neutral-900 text-white text-[10px] font-bold uppercase hover:bg-neutral-800 transition-colors text-center cursor-pointer border border-neutral-900"
            >
              Dr. Elena Vance
            </button>
            <button
              type="button"
              (click)="fillMarcusDemo()"
              class="px-2.5 py-1.5 bg-neutral-900 text-white text-[10px] font-bold uppercase hover:bg-neutral-800 transition-colors text-center cursor-pointer border border-neutral-900"
            >
              Prof. Marcus Chen
            </button>
          </div>
        </div>

        <!-- Signal Form -->
        <form (submit)="onSubmit($event)" novalidate class="space-y-4">
          <!-- Email Input -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
              Registered Profile Email *
            </label>
            <input
              type="email"
              [formField]="loginForm.email"
              class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="e.g. contact@drelenavance.com"
              autocomplete="email"
            />
          </div>

          <!-- Access Key Input -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
              Client Access Key *
            </label>
            <input
              type="password"
              [formField]="loginForm.accessKey"
              class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="e.g. vance2026 or access key"
              autocomplete="current-password"
            />
          </div>

          @if (errorMessage()) {
            <div class="p-3 bg-red-100 border border-red-500 text-red-900 text-xs font-mono font-medium">
              {{ errorMessage() }}
            </div>
          }

          <!-- Submit Button -->
          <div class="pt-2">
            <app-sharp-button
              type="submit"
              variant="primary"
              [fullWidth]="true"
              [disabled]="isSubmitting()"
            >
              @if (isSubmitting()) {
                <span>Signing In...</span>
              } @else {
                <span>Access Practitioner Portal &rarr;</span>
              }
            </app-sharp-button>
          </div>
        </form>

        <!-- Back Link -->
        <div class="mt-6 text-center border-t border-neutral-200 pt-4">
          <a
            routerLink="/"
            class="text-xs font-mono font-bold text-neutral-500 hover:text-neutral-900 uppercase tracking-wider transition-colors"
          >
            &larr; Back to Platform Home
          </a>
        </div>
      </div>
    </div>
  `,
})
export class PortalLoginComponent {
  private readonly clientAuth = inject(ClientAuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly credentials = signal({
    email: 'contact@drelenavance.com',
    accessKey: 'vance2026',
  });

  readonly loginForm = form(this.credentials, (schema) => {
    required(schema.email, { message: 'Registered email is required' });
    email(schema.email, { message: 'Valid email required' });
    required(schema.accessKey, { message: 'Access key is required' });
  });

  fillElenaDemo(): void {
    this.credentials.set({
      email: 'contact@drelenavance.com',
      accessKey: 'vance2026',
    });
  }

  fillMarcusDemo(): void {
    this.credentials.set({
      email: 'marcus@chenphysics.edu',
      accessKey: 'chen2026',
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set(null);

    const values = this.credentials();
    if (!values.email || !values.accessKey) {
      this.errorMessage.set('Please provide both your registered email and client access key.');
      return;
    }

    this.isSubmitting.set(true);

    this.clientAuth.login(values).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/portal']);
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        const message =
          (err as { error?: { error?: string } })?.error?.error ||
          'Invalid client credentials or access key.';
        this.errorMessage.set(message);
      },
    });
  }
}
