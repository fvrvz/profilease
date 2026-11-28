import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientAuthService } from '@service/client-auth.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-portal-reset-password',
  imports: [RouterLink, SharpButtonComponent, SharpIconComponent],
  template: `
    <div class="min-h-screen bg-neutral-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div class="w-full max-w-md bg-white border-2 border-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8">
        <div class="border-b-2 border-neutral-900 pb-4 mb-6 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-neutral-900 text-white mb-3">
            <app-sharp-icon name="shield" customClass="w-6 h-6" />
          </div>
          <h1 class="text-xl font-black uppercase tracking-tight text-neutral-900">
            Reset Practitioner Password
          </h1>
        </div>

        @if (successMessage()) {
          <div class="p-4 bg-emerald-50 border-2 border-emerald-600 text-emerald-900 text-xs font-mono mb-4">
            {{ successMessage() }}
          </div>
          <a
            routerLink="/portal/login"
            class="block text-center w-full py-3 bg-neutral-900 text-white text-xs font-mono font-bold uppercase tracking-wider"
          >
            Go to Portal Login →
          </a>
        } @else {
          <form (submit)="onSubmit($event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                New Password (min 8 chars) *
              </label>
              <input
                type="password"
                [value]="newPassword()"
                (input)="onInput(newPassword, $event)"
                required
                minlength="8"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                [value]="confirmPassword()"
                (input)="onInput(confirmPassword, $event)"
                required
                minlength="8"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
              />
            </div>

            @if (errorMessage()) {
              <div class="p-3 bg-red-100 border border-red-500 text-red-900 text-xs font-mono">
                {{ errorMessage() }}
              </div>
            }

            <app-sharp-button type="submit" variant="primary" [fullWidth]="true" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Resetting...' : 'Set New Password →' }}
            </app-sharp-button>
          </form>
        }
      </div>
    </div>
  `,
})
export class PortalResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientAuth = inject(ClientAuthService);

  readonly token = signal<string>('');
  readonly newPassword = signal<string>('');
  readonly confirmPassword = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token') || '';
    this.token.set(t);
    if (!t) {
      this.errorMessage.set('Missing password reset token in URL.');
    }
  }

  onInput(target: typeof this.newPassword, event: Event): void {
    target.set((event.target as HTMLInputElement).value);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set(null);

    if (!this.token()) {
      this.errorMessage.set('Invalid reset link.');
      return;
    }
    if (this.newPassword().trim().length < 8) {
      this.errorMessage.set('Password must be at least 8 characters.');
      return;
    }
    if (this.newPassword().trim() !== this.confirmPassword().trim()) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isSubmitting.set(true);
    this.clientAuth.resetPassword(this.token(), this.newPassword().trim()).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(res.message);
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        const msg = (err as { error?: { error?: string } })?.error?.error || 'Reset link is invalid or expired.';
        this.errorMessage.set(msg);
      },
    });
  }
}
