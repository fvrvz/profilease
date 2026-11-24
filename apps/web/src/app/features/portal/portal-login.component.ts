import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { form, FormField, required, email } from '@angular/forms/signals';
import { ClientAuthService } from '@service/client-auth.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-portal-login',
  imports: [
    RouterLink,
    FormField,
    SharpButtonComponent,
    SharpIconComponent,
  ],
  templateUrl: './portal-login.component.html',
})
export class PortalLoginComponent {
  private readonly clientAuth = inject(ClientAuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly credentials = signal({
    email: '',
    accessKey: '',
  });

  readonly loginForm = form(this.credentials, (schema) => {
    required(schema.email, { message: 'Registered email is required' });
    email(schema.email, { message: 'Valid email required' });
    required(schema.accessKey, { message: 'Access key is required' });
  });

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
