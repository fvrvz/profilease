import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ClientAuthService } from '@service/client-auth.service';

@Component({
  selector: 'app-portal-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './portal-layout.component.html',
})
export class PortalLayoutComponent {
  readonly authService = inject(ClientAuthService);

  logout(): void {
    this.authService.logout();
  }
}
