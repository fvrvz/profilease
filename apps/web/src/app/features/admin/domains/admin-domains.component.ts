import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserProfile, DomainResolutionResponse } from '@profilease/types';
import { ProfileService } from '@service/profile.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpBadgeComponent } from '@shared/components/sharp-badge.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-admin-domains',
  imports: [
    RouterLink,
    SharpButtonComponent,
    SharpBadgeComponent,
    SharpIconComponent,
  ],
  template: `
    <div class="space-y-8">
      <!-- Title & Header -->
      <div class="border-b-2 border-neutral-900 pb-5">
        <span class="text-xs font-mono uppercase tracking-widest text-neutral-500 block">
          Multi-Tenant Host Resolution
        </span>
        <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
          Client Custom Domains
        </h1>
        <p class="text-xs text-neutral-600 font-mono mt-1">
          Each doctor or teacher can point their personal or clinic domain directly to Profilease.
        </p>
      </div>

      <!-- DOMAIN SIMULATION TESTER -->
      <div class="bg-white border-2 border-neutral-900 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div class="border-b border-neutral-200 pb-3 mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <app-sharp-icon name="globe" customClass="w-4 h-4 text-neutral-800" />
            <h2 class="text-xs font-mono font-bold uppercase tracking-widest text-neutral-900">
              Test Host Resolution Simulation
            </h2>
          </div>
          <span class="text-[11px] font-mono text-neutral-500">Live API Check</span>
        </div>

        <p class="text-xs text-neutral-600 mb-4 font-mono">
          Enter any domain configured for a client to verify host-header matching and routing.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            #testHostInput
            placeholder="e.g. drelenavance.com or marcuschenphysics.edu"
            class="flex-1 px-3 py-2.5 bg-white border border-neutral-300 text-neutral-900 text-xs font-mono focus:border-neutral-900 focus:outline-none"
          />
          <app-sharp-button
            variant="primary"
            (btnClick)="testResolution(testHostInput.value)"
          >
            Verify Resolution
          </app-sharp-button>
        </div>

        @if (testResult()) {
          <div
            class="p-4 border-2 font-mono text-xs"
            [class.border-emerald-600]="testResult()?.matched"
            [class.bg-emerald-50]="testResult()?.matched"
            [class.border-amber-600]="!testResult()?.matched"
            [class.bg-amber-50]="!testResult()?.matched"
          >
            @if (testResult()?.matched) {
              <div class="flex items-start gap-2">
                <app-sharp-icon name="check" customClass="w-4 h-4 text-emerald-700 mt-0.5" />
                <div>
                  <strong class="text-emerald-900 uppercase block">Host Header Matched Successfully!</strong>
                  <p class="text-emerald-800 text-[11px] mt-0.5">
                    Domain resolves directly to <strong>{{ testResult()?.profile?.name }}</strong> (/@{{ testResult()?.profile?.slug }}).
                  </p>
                  <a
                    [routerLink]="['/@' + testResult()?.profile?.slug]"
                    target="_blank"
                    class="inline-block mt-2 px-3 py-1 bg-emerald-800 text-white text-[10px] uppercase font-bold"
                  >
                    Open Live Profile →
                  </a>
                </div>
              </div>
            } @else {
              <div class="flex items-start gap-2 text-amber-900">
                <app-sharp-icon name="alert" customClass="w-4 h-4 text-amber-700 mt-0.5" />
                <div>
                  <strong class="uppercase block">No Profile Mapped to This Host</strong>
                  <p class="text-[11px] mt-0.5">
                    Make sure the custom domain is saved on the client profile in the directory.
                  </p>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- DOMAINS DIRECTORY TABLE -->
      <div class="bg-white border-2 border-neutral-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div class="px-6 py-4 border-b-2 border-neutral-900 flex items-center justify-between bg-neutral-50">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-neutral-900"></span>
            <h2 class="text-xs font-mono font-bold uppercase tracking-widest text-neutral-900">
              Active Client Domain Mappings
            </h2>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr class="border-b border-neutral-200 bg-neutral-100/70 text-neutral-700 uppercase tracking-wider text-[11px]">
                <th class="py-3 px-4">Client Name</th>
                <th class="py-3 px-4">Profession</th>
                <th class="py-3 px-4">Configured Custom Domain</th>
                <th class="py-3 px-4">Direct Platform Route</th>
                <th class="py-3 px-4">DNS Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200">
              @for (prof of profileService.profiles(); track prof.id) {
                <tr class="hover:bg-neutral-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-neutral-900">
                    {{ prof.name }}
                  </td>
                  <td class="py-3.5 px-4 uppercase text-[11px]">
                    {{ prof.profession }}
                  </td>
                  <td class="py-3.5 px-4 font-bold">
                    @if (prof.customDomain) {
                      <span class="px-2.5 py-1 bg-neutral-900 text-white font-mono text-xs">
                        {{ prof.customDomain }}
                      </span>
                    } @else {
                      <span class="text-neutral-400 italic">No domain linked</span>
                    }
                  </td>
                  <td class="py-3.5 px-4">
                    <a
                      [routerLink]="['/@' + prof.slug]"
                      target="_blank"
                      class="text-neutral-900 underline hover:text-neutral-600 font-bold"
                    >
                      /&#64;{{ prof.slug }}
                    </a>
                  </td>
                  <td class="py-3.5 px-4">
                    @if (prof.customDomain) {
                      <app-sharp-badge variant="green">
                        CNAME / Host Mapped
                      </app-sharp-badge>
                    } @else {
                      <app-sharp-badge variant="neutral">
                        Subpath Only
                      </app-sharp-badge>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- DNS CONFIGURATION GUIDE -->
      <div class="bg-neutral-900 text-white border-2 border-neutral-900 p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-mono text-xs">
        <h3 class="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
          <app-sharp-icon name="shield" customClass="w-4 h-4 text-emerald-400" />
          <span>Client DNS Setup Instructions for Admins</span>
        </h3>
        <p class="text-neutral-300 text-xs mb-4">
          To host a doctor or teacher separately on their own domain (e.g. <code class="bg-neutral-800 px-1 py-0.5">drelenavance.com</code>), instruct their registrar (GoDaddy, Namecheap, Cloudflare) with either:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="border border-neutral-700 p-3 bg-neutral-800/80">
            <strong class="text-white uppercase block text-[11px] mb-1">Method A: CNAME Record (Subdomain)</strong>
            <div class="text-[11px] space-y-1 text-neutral-300">
              <div>Type: <span class="text-white font-bold">CNAME</span></div>
              <div>Host: <span class="text-white font-bold">www</span> or <span class="text-white font-bold">clinic</span></div>
              <div>Target: <span class="text-white font-bold">profilease.io</span></div>
            </div>
          </div>

          <div class="border border-neutral-700 p-3 bg-neutral-800/80">
            <strong class="text-white uppercase block text-[11px] mb-1">Method B: A Record (Apex Domain)</strong>
            <div class="text-[11px] space-y-1 text-neutral-300">
              <div>Type: <span class="text-white font-bold">A</span></div>
              <div>Host: <span class="text-white font-bold">&#64;</span></div>
              <div>Target: <span class="text-white font-bold">YOUR_SERVER_IP</span></div>
            </div>
          </div>
        </div>

        <p class="text-[11px] text-neutral-400">
          The built-in Angular SSR server inspects the <code class="text-white font-bold">Host</code> header on every incoming HTTP request and transparently routes visitors to the matching client profile with zero downtime.
        </p>
      </div>
    </div>
  `,
})
export class AdminDomainsComponent implements OnInit {
  protected readonly profileService = inject(ProfileService);
  readonly testResult = signal<DomainResolutionResponse | null>(null);

  ngOnInit(): void {
    this.profileService.loadAll().subscribe();
  }

  testResolution(host: string): void {
    const clean = host.trim();
    if (!clean) return;

    this.profileService.resolveCustomDomain(clean).subscribe({
      next: (res) => {
        this.testResult.set(res);
      },
      error: () => {
        this.testResult.set({ matched: false });
      },
    });
  }
}
