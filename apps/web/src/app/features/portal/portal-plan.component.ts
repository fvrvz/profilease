import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PLAN_CAPABILITIES, SubscriptionPlan, getPlanCapabilities } from '@profilease/types';
import { ClientAuthService } from '@service/client-auth.service';
import { ToastService } from '@service/toast.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';

interface PlanCard {
  readonly id: SubscriptionPlan;
  readonly name: string;
  readonly tagline: string;
  readonly features: readonly string[];
}

@Component({
  selector: 'app-portal-plan',
  standalone: true,
  imports: [RouterLink, SharpButtonComponent],
  template: `
    <div class="space-y-8 font-sans">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-neutral-900 pb-4">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-neutral-500 block">
            Subscription &amp; Billing
          </span>
          <h1 class="text-2xl font-black uppercase tracking-tight text-neutral-900">
            Change or Upgrade Your Plan
          </h1>
        </div>

        <div class="flex items-center gap-2 font-mono text-xs border-2 border-neutral-900 bg-white p-1 self-start sm:self-auto">
          <button
            type="button"
            (click)="billingCycle.set('yearly')"
            class="px-3 py-1.5 font-bold uppercase cursor-pointer transition-colors"
            [class.bg-neutral-900]="billingCycle() === 'yearly'"
            [class.text-white]="billingCycle() === 'yearly'"
          >
            Yearly
          </button>
          <button
            type="button"
            (click)="billingCycle.set('half_yearly')"
            class="px-3 py-1.5 font-bold uppercase cursor-pointer transition-colors"
            [class.bg-neutral-900]="billingCycle() === 'half_yearly'"
            [class.text-white]="billingCycle() === 'half_yearly'"
          >
            6 Months
          </button>
        </div>
      </div>

      <!-- Current Plan Status Banner -->
      <div class="bg-white border-2 border-neutral-900 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-[11px] font-mono font-bold uppercase tracking-widest text-neutral-500 block">
            Active Subscription
          </span>
          <div class="flex items-center gap-3 mt-1">
            <span class="text-xl font-black uppercase text-neutral-900">
              {{ currentCapabilities().label }} Plan
            </span>
            <span class="px-2 py-0.5 bg-emerald-100 border border-emerald-400 text-emerald-900 font-mono text-[10px] font-bold uppercase">
              {{ currentProfile()?.subscriptionStatus || 'active' }}
            </span>
          </div>
          <p class="text-xs font-mono text-neutral-600 mt-1">
            Service Limit: {{ currentCapabilities().baseServiceLimit + (currentProfile()?.extraServiceSlots || 0) }} services
            &bull; Custom Domain Add-on: {{ currentProfile()?.customDomainAddon ? 'Enabled' : 'Not Active' }}
          </p>
        </div>
        <a
          routerLink="/portal/appearance"
          class="px-4 py-2 bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-900 border-2 border-neutral-900 text-xs font-mono font-bold uppercase transition-colors self-start sm:self-auto"
        >
          Customize Appearance &rarr;
        </a>
      </div>

      <!-- Plan Comparison Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (card of planCards; track card.id) {
          @let cap = planCapabilities[card.id];
          @let price = getPrice(cap.yearlyPriceUsd);
          @let isCurrent = currentPlan() === card.id;

          <div
            class="bg-white border-2 p-6 flex flex-col justify-between transition-all"
            [class.border-neutral-900]="true"
            [class.shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]]="card.id === 'pro' || isCurrent"
            [class.shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]]="card.id !== 'pro' && !isCurrent"
          >
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span class="text-xs font-mono font-black uppercase tracking-widest text-neutral-900">
                  {{ card.name }}
                </span>
                @if (isCurrent) {
                  <span class="px-2 py-0.5 bg-neutral-900 text-white font-mono text-[10px] font-bold uppercase">
                    Current Plan
                  </span>
                } @else if (card.id === 'pro') {
                  <span class="px-2 py-0.5 bg-amber-100 border border-amber-400 text-amber-900 font-mono text-[10px] font-bold uppercase">
                    Recommended
                  </span>
                }
              </div>

              <div class="flex items-baseline gap-1 mb-2">
                <span class="text-3xl font-black font-mono text-neutral-900">\${{ price }}</span>
                <span class="text-xs font-mono text-neutral-500">
                  / {{ billingCycle() === 'yearly' ? 'year' : '6 mos' }}
                </span>
              </div>

              <p class="text-xs text-neutral-600 mb-5">{{ card.tagline }}</p>

              <ul class="space-y-2 text-xs font-mono text-neutral-800 border-t border-neutral-200 pt-4 mb-6">
                @for (feat of card.features; track feat) {
                  <li class="flex items-start gap-2">
                    <span class="text-emerald-700 font-bold">&#10003;</span>
                    <span>{{ feat }}</span>
                  </li>
                }
              </ul>
            </div>

            @if (isCurrent) {
              <button
                type="button"
                disabled
                class="w-full py-2.5 bg-neutral-100 text-neutral-500 border-2 border-neutral-300 text-xs font-mono font-bold uppercase cursor-not-allowed"
              >
                Active Plan
              </button>
            } @else {
              <app-sharp-button
                type="button"
                variant="primary"
                (btnClick)="selectPlan(card.id, price)"
              >
                Switch to {{ card.name }} (\${{ price }}) &rarr;
              </app-sharp-button>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class PortalPlanComponent {
  private readonly http = inject(HttpClient);
  private readonly clientAuth = inject(ClientAuthService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentProfile = this.clientAuth.currentProfile;
  readonly currentPlan = computed<SubscriptionPlan>(() => this.currentProfile()?.subscriptionPlan || 'basic');
  readonly currentCapabilities = computed(() => getPlanCapabilities(this.currentPlan()));
  readonly billingCycle = signal<'yearly' | 'half_yearly'>('yearly');
  readonly planCapabilities = PLAN_CAPABILITIES;

  readonly planCards: readonly PlanCard[] = [
    {
      id: 'basic',
      name: 'Basic',
      tagline: 'Everything needed for a solo practitioner portfolio and online booking.',
      features: [
        'Up to 3 service offerings',
        'All 6 curated color palettes',
        'Sharp or Rounded corners',
        'Light / Dark / System mode',
        'Email & WhatsApp booking alerts',
      ],
    },
    {
      id: 'mid',
      name: 'Mid',
      tagline: 'Flexible layouts and bio-link view for growing practices.',
      features: [
        'Up to 8 service offerings',
        'Split Sticky & Compact Grid layouts',
        'Link-Card Bio presentation view',
        'All Basic theme & corner options',
        'Priority booking notifications',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'Full brand ownership, custom CSS, and white-label presentation.',
      features: [
        'Up to 25 service offerings',
        'Editorial Magazine & Executive Dark views',
        'Custom accent, background & typography',
        'Scoped Custom CSS editor',
        'White-label branding removal',
      ],
    },
  ];

  getPrice(yearlyUsd: number): number {
    return this.billingCycle() === 'yearly' ? yearlyUsd : Math.round(yearlyUsd * 0.6);
  }

  selectPlan(planId: SubscriptionPlan, amountUsd: number): void {
    const profile = this.currentProfile();
    this.toast.startLoading(`Starting PayPal checkout for ${planId.toUpperCase()} plan...`);

    if (isPlatformBrowser(this.platformId) && profile) {
      sessionStorage.setItem('profilease_pending_plan', planId);
      sessionStorage.setItem('profilease_pending_profile_id', profile.id);
    }

    this.http
      .post<{ approveUrl?: string; error?: string }>('/api/billing/paypal/create-order', {
        planId,
        billingCycle: this.billingCycle(),
        amountUsd,
      })
      .subscribe({
        next: (res) => {
          this.toast.stopLoading();
          if (res.approveUrl && isPlatformBrowser(this.platformId)) {
            window.location.href = res.approveUrl;
            return;
          }
          this.toast.showError(res.error || 'PayPal checkout URL was not returned.');
        },
        error: (err: unknown) => {
          this.toast.stopLoading();
          const msg =
            (err as { error?: { error?: string } })?.error?.error ||
            'Failed to initialize PayPal checkout.';
          this.toast.showError(msg);
        },
      });
  }
}
