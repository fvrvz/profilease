import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ClientAuthService } from '@service/client-auth.service';

@Component({
  selector: 'app-portal-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './portal-layout.component.html',
})
export class PortalLayoutComponent {
  readonly authService = inject(ClientAuthService);

  readonly currentPassword = signal<string>('');
  readonly newPassword = signal<string>('');
  readonly confirmPassword = signal<string>('');
  readonly passwordError = signal<string | null>(null);
  readonly isUpdatingPassword = signal<boolean>(false);

  onChangePassword(event: Event): void {
    event.preventDefault();
    this.passwordError.set(null);

    const curr = this.currentPassword().trim();
    const next = this.newPassword().trim();
    const conf = this.confirmPassword().trim();

    if (!curr || next.length < 8) {
      this.passwordError.set('Enter your temporary password and a new password (min 8 characters).');
      return;
    }
    if (next !== conf) {
      this.passwordError.set('New password and confirmation do not match.');
      return;
    }

    this.isUpdatingPassword.set(true);
    this.authService.changePassword(curr, next).subscribe({
      next: () => {
        this.isUpdatingPassword.set(false);
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
      },
      error: (err: unknown) => {
        this.isUpdatingPassword.set(false);
        const msg =
          (err as { error?: { error?: string } })?.error?.error || 'Could not update password.';
        this.passwordError.set(msg);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
