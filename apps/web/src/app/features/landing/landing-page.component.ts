import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../core/services/profile.service';
import { SharpBadgeComponent } from '../../shared/components/sharp-badge.component';
import { SharpIconComponent } from '../../shared/components/sharp-icon.component';

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

          <div class="flex items-center gap-4">
            <a
              routerLink="/admin"
              class="px-4 py-2 bg-white text-neutral-900 hover:bg-neutral-200 text-xs font-mono font-bold uppercase tracking-wider border border-white transition-colors"
            >
              Admin Portal →
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
            Generate high-converting, sharp modern portfolio sites with integrated appointment scheduling, service catalogs, and custom domain hosting. Built on Angular v22 Signals and built-in SSR.
          </p>

          <div class="flex flex-wrap items-center gap-4 pt-4 border-t-2 border-neutral-900">
            <a
              routerLink="/admin/onboard"
              class="px-6 py-3.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider border-2 border-neutral-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 transition-all cursor-pointer"
            >
              + Onboard New Client Now
            </a>
            <a
              routerLink="/admin"
              class="px-6 py-3.5 bg-white text-neutral-900 text-xs font-bold uppercase tracking-wider border-2 border-neutral-900 hover:bg-neutral-100 transition-all"
            >
              Explore Admin Control Room
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
                    class="w-16 h-16 sm:w-20 sm:h-20 object-cover border-2 border-neutral-900 grayscale contrast-125"
                  />
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <app-sharp-badge [variant]="getProfessionBadge(prof.profession)">
                        {{ prof.profession }}
                      </app-sharp-badge>
                      <span class="text-[10px] font-mono text-neutral-500">{{ prof.theme }}</span>
                    </div>
                    <h3 class="text-lg font-black uppercase tracking-tight text-neutral-900">
                      {{ prof.name }}
                    </h3>
                    <p class="text-xs font-mono font-bold text-neutral-700">
                      {{ prof.title }}
                    </p>
                  </div>
                </div>

                <p class="text-xs text-neutral-600 line-clamp-3 mb-4 leading-relaxed">
                  {{ prof.bio }}
                </p>

                <!-- Credentials chips -->
                <div class="flex flex-wrap gap-1.5 mb-6">
                  @for (cred of prof.credentials.slice(0, 2); track cred) {
                    <span class="px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-[10px] font-mono text-neutral-700">
                      ✓ {{ cred }}
                    </span>
                  }
                </div>

                <!-- Custom domain banner -->
                <div class="p-3 bg-neutral-50 border border-neutral-200 mb-6 font-mono text-[11px] text-neutral-600 flex items-center justify-between">
                  <span>Custom Domain:</span>
                  <strong class="text-neutral-900">
                    {{ prof.customDomain || 'Not set (using /@' + prof.slug + ')' }}
                  </strong>
                </div>
              </div>

              <div class="pt-4 border-t-2 border-neutral-900 flex items-center justify-between">
                <span class="text-xs font-mono font-bold text-neutral-800">
                  {{ prof.services.length }} Available Services
                </span>
                <a
                  [routerLink]="['/@' + prof.slug]"
                  class="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider border border-neutral-900 transition-colors flex items-center gap-2"
                >
                  <span>View Live Site</span>
                  <app-sharp-icon name="chevron-right" customClass="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- PLATFORM HIGHLIGHTS -->
      <section class="border-t-2 border-neutral-900 bg-white py-16 px-4 sm:px-6">
        <div class="max-w-6xl mx-auto">
          <div class="border-b-2 border-neutral-900 pb-3 mb-8">
            <span class="text-xs font-mono uppercase tracking-widest text-neutral-500 block">Core Architecture</span>
            <h2 class="text-2xl font-black uppercase tracking-tight text-neutral-900">
              Why Profilease Excels
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div class="p-6 border-2 border-neutral-900 bg-neutral-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span class="w-8 h-8 bg-neutral-900 text-white flex items-center justify-center font-bold mb-3">01</span>
              <strong class="text-sm font-bold uppercase text-neutral-900 block mb-2">Zero Rounded Corners</strong>
              <p class="text-neutral-600 leading-relaxed font-sans text-xs">
                Pure pointy neo-brutalist and architectural precision. Bold typography, high-contrast borders, and razor-sharp interfaces.
              </p>
            </div>

            <div class="p-6 border-2 border-neutral-900 bg-neutral-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span class="w-8 h-8 bg-neutral-900 text-white flex items-center justify-center font-bold mb-3">02</span>
              <strong class="text-sm font-bold uppercase text-neutral-900 block mb-2">Angular v22 Signal Forms</strong>
              <p class="text-neutral-600 leading-relaxed font-sans text-xs">
                Real-time reactive appointment scheduling and client intake powered by the newest Angular &#64;angular/forms/signals API.
              </p>
            </div>

            <div class="p-6 border-2 border-neutral-900 bg-neutral-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span class="w-8 h-8 bg-neutral-900 text-white flex items-center justify-center font-bold mb-3">03</span>
              <strong class="text-sm font-bold uppercase text-neutral-900 block mb-2">Host Header Domain Mapping</strong>
              <p class="text-neutral-600 leading-relaxed font-sans text-xs">
                Inbuilt Angular SSR backend inspects domain hosts and serves clients their own independent website on their personal domain.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="bg-neutral-900 text-white py-8 px-4 text-center font-mono text-xs border-t-2 border-neutral-900 mt-auto">
        <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-white"></span>
            <span class="font-bold uppercase">Profilease Engine</span>
            <span class="text-neutral-500">© 2026</span>
          </div>

          <div class="flex items-center gap-4 text-neutral-400">
            <a routerLink="/admin" class="hover:text-white underline">Admin Control Room</a>
            <span>•</span>
            <a routerLink="/admin/onboard" class="hover:text-white underline">Onboard Profile</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingPageComponent implements OnInit {
  protected readonly profileService = inject(ProfileService);

  ngOnInit(): void {
    this.profileService.loadAll().subscribe();
  }

  getProfessionBadge(profession: string): 'teal' | 'indigo' | 'amber' | 'neutral' {
    switch (profession) {
      case 'doctor':
        return 'teal';
      case 'teacher':
        return 'indigo';
      case 'coach':
      case 'therapist':
        return 'amber';
      default:
        return 'neutral';
    }
  }
}
