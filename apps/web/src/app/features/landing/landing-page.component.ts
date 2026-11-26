import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CurrencyService } from '@service/currency.service';
import { SharpBadgeComponent } from '@shared/components/sharp-badge.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

interface TestimonialItem {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly domain: string;
  readonly tag: 'Medical' | 'Education' | 'Consulting';
}

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, SharpBadgeComponent, SharpIconComponent],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {
  protected readonly currencyService = inject(CurrencyService);
  private readonly http = inject(HttpClient);

  readonly billingCycle = signal<'yearly' | 'half_yearly'>('yearly');
  readonly hasOwnDomain = signal<boolean>(false);
  readonly hasOwnHosting = signal<boolean>(false);
  readonly checkoutLoadingPlan = signal<string | null>(null);
  readonly checkoutError = signal<string | null>(null);

  // Basic plan: flat $20/yr base; we manage domain + hosting on their behalf.
  // Discounts apply when practitioner brings their own domain / hosting.
  // Usage-based add-ons are billed separately on top.
  readonly headlessPriceUsd = computed<number>(() => {
    const base = this.billingCycle() === 'yearly' ? 20 : 12;
    const domainDiscount = this.hasOwnDomain() ? (this.billingCycle() === 'yearly' ? 5 : 3) : 0;
    const hostingDiscount = this.hasOwnHosting() ? (this.billingCycle() === 'yearly' ? 5 : 2) : 0;
    return Math.max(10, base - domainDiscount - hostingDiscount);
  });

  // Pro plan: $299/yr full white-label; discounts for own domain / hosting.
  readonly proPriceUsd = computed<number>(() => {
    const base = this.billingCycle() === 'yearly' ? 299 : 169;
    const domainDiscount = this.hasOwnDomain() ? (this.billingCycle() === 'yearly' ? 15 : 8) : 0;
    const hostingDiscount = this.hasOwnHosting() ? (this.billingCycle() === 'yearly' ? 50 : 25) : 0;
    return Math.max(99, base - domainDiscount - hostingDiscount);
  });

  readonly testimonials: readonly TestimonialItem[] = [
    {
      quote:
        'Moving from generic link trees to my own domain doubled patient bookings in two weeks. Patients see my consultation fees in their local currency and never have to pay upfront.',
      name: 'Dr. Elena Vance, MD',
      role: 'Senior Cardiologist · Boston',
      domain: 'drelenavance.com',
      tag: 'Medical',
    },
    {
      quote:
        'My students book 1-on-1 physics mentorship slots directly from my site. The instant WhatsApp & email confirmation links save me hours of back-and-forth every week.',
      name: 'Prof. Marcus Chen',
      role: 'Applied Physics Mentor · Toronto',
      domain: 'marcuschenphysics.edu',
      tag: 'Education',
    },
    {
      quote:
        'Zero bloat, razor-sharp typography, and strict custom-domain isolation—my clients only ever see my practice, never another directory.',
      name: 'Dr. Ananya Rao',
      role: 'Clinical Psychologist · Bengaluru',
      domain: 'ananyaraoclinic.in',
      tag: 'Consulting',
    },
  ];

  subscribeWithPayPal(planId: 'headless' | 'pro'): void {
    this.checkoutError.set(null);
    this.checkoutLoadingPlan.set(planId);
    const amountUsd = planId === 'headless' ? this.headlessPriceUsd() : this.proPriceUsd();

    this.http
      .post<{ approveUrl?: string }>('/api/billing/paypal/create-order', {
        planId,
        billingCycle: this.billingCycle(),
        amountUsd,
        hasOwnDomain: this.hasOwnDomain(),
        hasOwnHosting: this.hasOwnHosting(),
      })
      .subscribe({
        next: (res) => {
          this.checkoutLoadingPlan.set(null);
          if (res.approveUrl) {
            window.open(res.approveUrl, '_blank', 'noopener,noreferrer');
          }
        },
        error: () => {
          this.checkoutLoadingPlan.set(null);
          this.checkoutError.set('Unable to start PayPal checkout right now. Please try again.');
        },
      });
  }
}
