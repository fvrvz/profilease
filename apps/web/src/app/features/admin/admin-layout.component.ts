import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminAuthService } from '@service/admin-auth.service';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SharpIconComponent,
  ],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  readonly authService = inject(AdminAuthService);

  logout(): void {
    this.authService.logout();
  }
}
