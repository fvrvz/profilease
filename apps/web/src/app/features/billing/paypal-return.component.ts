import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientAuthService } from '@service/client-auth.service';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-paypal-return',
  imports: [RouterLink, SharpIconComponent],
  template: `
    <div class="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans">
      <div class="w-full max-w-md bg-white border-2 border-neutral-900 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
        @if (isCapturing()) {
          <div class="inline-block animate-spin w-8 h-8 border-4 border-neutral-900 border-t-transparent mb-4"></div>
          <h1 class="text-lg font-black uppercase tracking-tight text-neutral-900">
            Finalizing PayPal Payment...
          </h1>
          <p class="text-xs font-mono text-neutral-600 mt-2">
            Verifying and activating your subscription.
          </p>
        } @else if (errorMessage()) {
          <div class="inline-flex items-center justify-center w-12 h-12 bg-red-100 text-red-700 border border-red-400 mb-4">
            <app-sharp-icon name="alert" customClass="w-6 h-6" />
          </div>
          <h1 class="text-lg font-black uppercase tracking-tight text-neutral-900 mb-2">
            Payment Verification Failed
          </h1>
          <p class="text-xs font-mono text-red-700 mb-6">{{ errorMessage() }}</p>
          <a
            routerLink="/"
            class="inline-block px-5 py-3 bg-neutral-900 text-white text-xs font-mono font-bold uppercase tracking-wider"
          >
            Return to Pricing →
          </a>
        } @else {
          <div class="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-700 border border-emerald-400 mb-4">
            <app-sharp-icon name="check" customClass="w-6 h-6" />
          </div>
          <span class="block text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold mb-1">
            Subscription Active
          </span>
          <h1 class="text-xl font-black uppercase tracking-tight text-neutral-900 mb-2">
            Payment Confirmed
          </h1>
          <p class="text-xs font-mono text-neutral-600 mb-6">
            Order <strong>{{ orderId() }}</strong> captured for the <strong>{{ planId().toUpperCase() }}</strong> plan.
          </p>
          <a
            [routerLink]="clientAuth.isAuthenticated() ? '/portal/appearance' : '/portal/login'"
            class="inline-block w-full py-3 bg-neutral-900 text-white text-xs font-mono font-bold uppercase tracking-wider"
          >
            {{ clientAuth.isAuthenticated() ? 'Open Appearance Studio →' : 'Sign In to Practitioner Portal →' }}
          </a>
        }
      </div>
    </div>
  `,
})
export class PayPalReturnComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  protected readonly clientAuth = inject(ClientAuthService);

  readonly isCapturing = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly orderId = signal<string>('');
  readonly planId = signal<string>('basic');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    const plan = this.route.snapshot.queryParamMap.get('plan') || 'basic';
    this.orderId.set(token);
    this.planId.set(plan);

    if (!token) {
      this.isCapturing.set(false);
      this.errorMessage.set('Missing PayPal order token in return URL.');
      return;
    }

    const profileId = this.clientAuth.currentProfile()?.id;
    this.http
      .post<{ success: boolean; orderId: string; plan: string }>('/api/billing/paypal/capture-order', {
        orderId: token,
        planId: plan,
        profileId,
      })
      .subscribe({
        next: (res) => {
          this.isCapturing.set(false);
          if (!res.success) {
            this.errorMessage.set('PayPal payment could not be completed.');
          }
        },
        error: (err: unknown) => {
          this.isCapturing.set(false);
          const msg = (err as { error?: { error?: string } })?.error?.error || 'Could not capture PayPal order.';
          this.errorMessage.set(msg);
        },
      });
  }
}
