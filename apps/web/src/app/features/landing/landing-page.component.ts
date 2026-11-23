import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileService } from '@service/profile.service';
import { SharpBadgeComponent } from '@shared/components/sharp-badge.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    RouterLink,
    SharpBadgeComponent,
    SharpIconComponent,
  ],
  template: `
    <div class="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col font-sans">
      <!-- Top Platform Bar -->
      <header class="bg-neutral-900 text-white border-b-2 border-neutral-900 sticky top-0 z-40">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-3.5 h-3.5 bg-white"></span>
            <span class="text-base font-black uppercase tracking-tight text-white font-mono">
              Profilease
            </span>
          </div>

          <div class="flex items-center gap-3">
            <a
              routerLink="/portal"
              class="px-3.5 py-1.5 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-xs font-mono font-bold uppercase tracking-wider border border-neutral-700 transition-colors"
            >
              Client Portal &rarr;
            </a>
            <a
              routerLink="/admin"
              class="px-3.5 py-1.5 bg-white text-neutral-900 hover:bg-neutral-200 text-xs font-mono font-bold uppercase tracking-wider border border-white transition-colors"
            >
              Admin Portal &rarr;
            </a>
          </div>
        </div>
      </header>

      <!-- HERO BANNER -->
      <section class="max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div class="bg-white border-2 border-neutral-900 p-8 sm:p-14 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          <div class="flex items-center gap-2 mb-3">
            <span class="inline-block w-2.5 h-2.5 bg-neutral-900"></span>
            <span class="text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">
              Next-Gen Portfolio & Booking Engine
            </span>
          </div>

          <h1 class="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-neutral-900 leading-none mb-6">
            Bespoke Portfolios for Doctors & Educators.
          </h1>

          <p class="text-sm sm:text-base text-neutral-700 max-w-2xl font-normal leading-relaxed mb-8">
            Generate high-converting, sharp modern portfolio sites with integrated appointment scheduling, service catalogs, autonomous client self-service dashboards, and real-time Email & WhatsApp instant actions.
          </p>

          <div class="flex flex-wrap items-center gap-4 pt-4 border-t-2 border-neutral-900">
            <a
              routerLink="/admin/onboard"
              class="px-6 py-3.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider border-2 border-neutral-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 transition-all cursor-pointer"
            >
              + Onboard New Client
            </a>
            <a
              routerLink="/portal"
              class="px-6 py-3.5 bg-neutral-900 text-emerald-400 text-xs font-bold uppercase tracking-wider border-2 border-neutral-900 hover:bg-neutral-800 transition-all flex items-center gap-2"
            >
              <app-sharp-icon name="user" customClass="w-3.5 h-3.5" />
              <span>Practitioner Portal Login</span>
            </a>
            <a
              routerLink="/admin"
              class="px-6 py-3.5 bg-white text-neutral-900 text-xs font-bold uppercase tracking-wider border-2 border-neutral-900 hover:bg-neutral-100 transition-all"
            >
              Admin Control Room
            </a>
          </div>
        </div>
      </section>

      <!-- LIVE GENERATED PROFILES SHOWCASE -->
      <section class="max-w-6xl w-full mx-auto px-4 sm:px-6 pb-16">
        <div class="border-b-2 border-neutral-900 pb-3 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span class="text-xs font-mono uppercase tracking-widest text-neutral-500 block">Directory Showcase</span>
            <h2 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
              Live Generated Client Portfolios
            </h2>
          </div>
          <span class="text-xs font-mono text-neutral-600 font-bold">
            Select a profile to view the live website
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          @for (prof of profileService.profiles(); track prof.id) {
            <div class="bg-white border-2 border-neutral-900 p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:translate-x-1 hover:-translate-y-1 transition-transform">
              <div>
                <div class="flex items-start gap-4 mb-4">
                  <img
                    [src]="prof.avatarUrl"
                    [alt]="prof.name"
                    class="w-16 h-16 object-cover border-2 border-neutral-900 shrink-0"
                  />
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <app-sharp-badge [variant]="prof.profession === 'doctor' ? 'teal' : 'indigo'">
                        {{ prof.profession }}
                      </app-sharp-badge>
                      <span class="text-[11px] font-mono text-neutral-500">{{ prof.country }}</span>
                    </div>
                    <h3 class="text-lg font-bold text-neutral-900 leading-tight">
                      {{ prof.name }}
                    </h3>
                    <p class="text-xs text-neutral-600 font-mono mt-0.5">
                      {{ prof.clinicOrSchoolName }}
                    </p>
                  </div>
                </div>

                <p class="text-xs text-neutral-700 line-clamp-3 mb-4 leading-relaxed font-sans">
                  {{ prof.bio }}
                </p>

                <!-- Domain Info -->
                <div class="bg-neutral-50 border border-neutral-200 p-3 mb-4 font-mono text-xs">
                  <div class="flex items-center justify-between text-neutral-600 mb-1">
                    <span class="text-[10px] uppercase font-bold text-neutral-400">Hosting Mode:</span>
                    @if (prof.customDomain) {
                      <span class="text-emerald-700 font-bold flex items-center gap-1">
                        <app-sharp-icon name="globe" customClass="w-3 h-3" />
                        Custom Host
                      </span>
                    } @else {
                      <span class="text-neutral-600 font-bold">Sub-Route</span>
                    }
                  </div>
                  <div class="text-neutral-900 font-bold truncate">
                    @if (prof.customDomain) {
                      <span>{{ prof.customDomain }}</span>
                    } @else {
                      <span>profilease.io/&#64;{{ prof.slug }}</span>
                    }
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-neutral-200 flex items-center justify-between">
                <span class="text-xs font-mono font-bold text-neutral-500">
                  {{ prof.services.length }} Services Cataloged
                </span>

                <a
                  [routerLink]="['/@' + prof.slug]"
                  class="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <span>Visit Portfolio</span>
                  <app-sharp-icon name="external-link" customClass="w-3 h-3" />
                </a>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="border-t-2 border-neutral-900 bg-white py-8 mt-auto font-mono text-xs text-neutral-600">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-neutral-900"></span>
            <span class="font-bold uppercase tracking-wider text-neutral-900">Profilease Platform</span>
          </div>
          <div class="flex items-center gap-4 text-xs font-bold uppercase">
            <a routerLink="/portal" class="hover:text-neutral-900">Client Portal</a>
            <span>&bull;</span>
            <a routerLink="/admin" class="hover:text-neutral-900">Admin Control Room</a>
            <span>&bull;</span>
            <a routerLink="/admin/domains" class="hover:text-neutral-900">Domain Simulator</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingPageComponent implements OnInit {
  readonly profileService = inject(ProfileService);

  ngOnInit(): void {
    this.profileService.loadAll().subscribe();
  }
}
