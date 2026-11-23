import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { form, FormField, required, email } from '@angular/forms/signals';
import { AdminAuthService } from '@service/admin-auth.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-admin-login',
  imports: [
    RouterLink,
    FormField,
    SharpButtonComponent,
    SharpIconComponent,
  ],
  template: `
    <div class="min-h-screen bg-neutral-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <!-- Sharp Card Container -->
      <div class="w-full max-w-md bg-white border-2 border-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8">
        <!-- Brand / Header -->
        <div class="border-b-2 border-neutral-900 pb-5 mb-6 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-neutral-900 text-white mb-3">
            <app-sharp-icon name="shield" customClass="w-6 h-6" />
          </div>
          <span class="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-1">
            Restricted Access
          </span>
          <h1 class="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
            Profilease Admin
          </h1>
          <p class="text-xs text-neutral-600 mt-1">
            Authenticate to onboard professionals and manage domains.
          </p>
        </div>

        <!-- Quick Demo Hint -->
        <div class="bg-neutral-50 border border-neutral-300 p-3 mb-6 font-mono text-[11px] text-neutral-700">
          <div class="flex items-center justify-between font-bold uppercase text-[10px] text-neutral-500 mb-1">
            <span>Pre-filled Demo Credentials</span>
            <button
              type="button"
              (click)="fillDemoCredentials()"
              class="text-neutral-900 underline hover:text-neutral-600 cursor-pointer"
            >
              Click to Apply
            </button>
          </div>
          <div>User: <code class="bg-neutral-200 px-1 py-0.5">admin&#64;profilease.io</code></div>
          <div>Pass: <code class="bg-neutral-200 px-1 py-0.5">admin123</code></div>
        </div>

        <!-- Signal Form -->
        <form (submit)="onSubmit($event)" novalidate class="space-y-4">
          <!-- Email Input -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
              Admin Email *
            </label>
            <input
              type="email"
              [formField]="loginForm.email"
              placeholder="admin@profilease.io"
              class="w-full px-3 py-2.5 bg-white border border-neutral-300 text-neutral-900 text-xs font-mono focus:border-neutral-900 focus:outline-none"
            />
            @if (loginForm.email().invalid() && loginForm.email().touched()) {
              <p class="text-[11px] text-red-600 font-mono mt-1">
                {{ loginForm.email().errors()[0]?.message || 'Valid email required' }}
              </p>
            }
          </div>

          <!-- Password Input -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
              Password *
            </label>
            <input
              type="password"
              [formField]="loginForm.password"
              placeholder="••••••••"
              class="w-full px-3 py-2.5 bg-white border border-neutral-300 text-neutral-900 text-xs font-mono focus:border-neutral-900 focus:outline-none"
            />
            @if (loginForm.password().invalid() && loginForm.password().touched()) {
              <p class="text-[11px] text-red-600 font-mono mt-1">
                {{ loginForm.password().errors()[0]?.message || 'Password required' }}
              </p>
            }
          </div>

          @if (errorMessage()) {
            <div class="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-mono flex items-center gap-2">
              <app-sharp-icon name="alert" customClass="w-4 h-4 shrink-0" />
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <div class="pt-2">
            <app-sharp-button
              variant="primary"
              type="submit"
              [fullWidth]="true"
              size="lg"
              [loading]="isLoading()"
              [disabled]="loginForm().invalid()"
            >
              Sign In to Admin Portal →
            </app-sharp-button>
          </div>
        </form>

        <div class="mt-6 pt-4 border-t border-neutral-200 text-center">
          <a routerLink="/" class="text-xs font-mono text-neutral-500 hover:text-neutral-900 underline">
            ← Back to Public Directory
          </a>
        </div>
      </div>
    </div>
  `,
})
export class AdminLoginComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Signal Form model
  readonly loginModel = signal({
    email: '',
    password: '',
  });

  readonly loginForm = form(this.loginModel, (schema) => {
    required(schema.email, { message: 'Admin email is required' });
    email(schema.email, { message: 'Must be a valid email address' });
    required(schema.password, { message: 'Password is required' });
  });

  fillDemoCredentials(): void {
    this.loginModel.set({
      email: 'admin@profilease.io',
      password: 'admin123',
    });
  }

  onSubmit(e: Event): void {
    e.preventDefault();
    if (this.loginForm().invalid()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const values = this.loginModel();
    this.auth.login(values).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Invalid admin email or password. Please try again.');
      },
    });
  }
}
