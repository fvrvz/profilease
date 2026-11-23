import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { SharpIconComponent } from '../../shared/components/sharp-icon.component';

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SharpIconComponent,
  ],
  template: `
    <div class="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col font-sans">
      <!-- Top Admin Header -->
      <header class="bg-neutral-900 text-white border-b-2 border-neutral-900 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <span class="w-3.5 h-3.5 bg-white"></span>
            <div>
              <span class="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block leading-none">
                Admin Control Room
              </span>
              <span class="text-sm font-black uppercase tracking-tight text-white">
                Profilease Multi-Tenant Engine
              </span>
            </div>
          </div>

          <!-- Main Nav Links -->
          <nav class="hidden md:flex items-center gap-1 font-mono text-xs uppercase font-bold">
            <a
              routerLink="/admin"
              routerLinkActive="bg-white text-neutral-900"
              [routerLinkActiveOptions]="{ exact: true }"
              class="px-3.5 py-2 hover:bg-neutral-800 text-neutral-300 transition-colors"
            >
              Dashboard
            </a>
            <a
              routerLink="/admin/onboard"
              routerLinkActive="bg-white text-neutral-900"
              class="px-3.5 py-2 hover:bg-neutral-800 text-neutral-300 transition-colors"
            >
              + Onboard Client
            </a>
            <a
              routerLink="/admin/appointments"
              routerLinkActive="bg-white text-neutral-900"
              class="px-3.5 py-2 hover:bg-neutral-800 text-neutral-300 transition-colors"
            >
              Appointments
            </a>
            <a
              routerLink="/admin/domains"
              routerLinkActive="bg-white text-neutral-900"
              class="px-3.5 py-2 hover:bg-neutral-800 text-neutral-300 transition-colors"
            >
              Custom Domains
            </a>
          </nav>

          <!-- User & Logout -->
          <div class="flex items-center gap-3">
            <a
              routerLink="/"
              target="_blank"
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-700 text-[11px] font-mono text-neutral-300 hover:text-white hover:border-white transition-colors"
            >
              <app-sharp-icon name="external-link" customClass="w-3 h-3" />
              <span>View Public Site</span>
            </a>

            <button
              type="button"
              (click)="auth.logout()"
              class="px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-mono font-bold uppercase tracking-wider border border-red-500 cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>

        <!-- Mobile Nav Bar -->
        <div class="md:hidden flex border-t border-neutral-800 overflow-x-auto text-[11px] font-mono uppercase">
          <a
            routerLink="/admin"
            routerLinkActive="bg-white text-neutral-900"
            [routerLinkActiveOptions]="{ exact: true }"
            class="px-3 py-2 text-neutral-300 shrink-0"
          >
            Dashboard
          </a>
          <a
            routerLink="/admin/onboard"
            routerLinkActive="bg-white text-neutral-900"
            class="px-3 py-2 text-neutral-300 shrink-0"
          >
            + Onboard
          </a>
          <a
            routerLink="/admin/appointments"
            routerLinkActive="bg-white text-neutral-900"
            class="px-3 py-2 text-neutral-300 shrink-0"
          >
            Bookings
          </a>
          <a
            routerLink="/admin/domains"
            routerLinkActive="bg-white text-neutral-900"
            class="px-3 py-2 text-neutral-300 shrink-0"
          >
            Domains
          </a>
        </div>
      </header>

      <!-- Content Area -->
      <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AdminAuthService);
}
