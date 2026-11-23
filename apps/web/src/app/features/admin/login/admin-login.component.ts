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
  templateUrl: './admin-login.component.html',
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
