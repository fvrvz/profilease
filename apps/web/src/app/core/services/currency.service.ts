import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SharpSelectOption } from '@shared/components/sharp-select.component';

export interface CurrencyConfig {
  readonly code: string;
  readonly symbol: string;
  readonly name: string;
  readonly flag?: string;
}

export const SUPPORTED_CURRENCIES: readonly CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
];

// Baseline exchange rates against 1 USD (fallback when offline or on SSR)
const DEFAULT_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 84.5,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 153.2,
  SGD: 1.34,
  AED: 3.67,
  CHF: 0.88,
  CNY: 7.24,
  BRL: 5.82,
};

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  // Real-time rates map (code -> rate vs USD)
  readonly rates = signal<Record<string, number>>(DEFAULT_RATES_TO_USD);

  // Active viewing currency (automatically detected or user overridden)
  readonly activeCurrency = signal<string>('USD');
  readonly detectedUserCountry = signal<string>('US');

  constructor() {
    this.detectUserCurrency();
    this.fetchLiveExchangeRates();
  }

  // Dropdown options formatted for SharpSelectComponent
  readonly currencyOptions = computed<readonly SharpSelectOption[]>(() => {
    return SUPPORTED_CURRENCIES.map((c) => ({
      value: c.code,
      label: `${c.code} (${c.symbol})`,
      sublabel: c.name,
      badge: c.symbol,
    }));
  });

  // Detect Country & Currency based on Browser Locale & Timezone
  private detectUserCurrency(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const mapped = this.mapTimezoneToCurrency(tz);
      if (mapped) {
        this.activeCurrency.set(mapped.currency);
        this.detectedUserCountry.set(mapped.country);
      }
    } catch {
      // Fallback to USD
    }
  }

  private mapTimezoneToCurrency(tz: string): { currency: string; country: string } | null {
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) {
      return { currency: 'INR', country: 'IN' };
    }
    if (tz.includes('London')) {
      return { currency: 'GBP', country: 'GB' };
    }
    if (
      tz.includes('Paris') ||
      tz.includes('Berlin') ||
      tz.includes('Rome') ||
      tz.includes('Madrid') ||
      tz.includes('Amsterdam') ||
      tz.includes('Brussels') ||
      tz.includes('Vienna')
    ) {
      return { currency: 'EUR', country: 'EU' };
    }
    if (tz.includes('Tokyo')) {
      return { currency: 'JPY', country: 'JP' };
    }
    if (tz.includes('Dubai')) {
      return { currency: 'AED', country: 'AE' };
    }
    if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal')) {
      return { currency: 'CAD', country: 'CA' };
    }
    if (tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Brisbane')) {
      return { currency: 'AUD', country: 'AU' };
    }
    if (tz.includes('Singapore')) {
      return { currency: 'SGD', country: 'SG' };
    }
    if (tz.includes('Zurich')) {
      return { currency: 'CHF', country: 'CH' };
    }
    if (tz.includes('Shanghai') || tz.includes('Chongqing')) {
      return { currency: 'CNY', country: 'CN' };
    }
    if (tz.includes('Sao_Paulo')) {
      return { currency: 'BRL', country: 'BR' };
    }
    if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Denver')) {
      return { currency: 'USD', country: 'US' };
    }
    return null;
  }

  // Fetch real-time live rates from free open exchange rate API
  private fetchLiveExchangeRates(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.http.get<{ rates?: Record<string, number> }>('https://open.er-api.com/v6/latest/USD').subscribe({
      next: (data) => {
        if (data && data.rates) {
          this.rates.update((current) => ({
            ...current,
            ...data.rates,
          }));
        }
      },
      error: () => {
        // Transparent fallback to baseline rates on network block
      },
    });
  }

  getSymbol(currencyCode: string): string {
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
    return found ? found.symbol : currencyCode;
  }

  // Convert amount from practitioner's base currency to target viewing currency
  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;

    const ratesMap = this.rates();
    const fromRate = ratesMap[fromCurrency] || 1.0;
    const toRate = ratesMap[toCurrency] || 1.0;

    // Convert via USD anchor
    const amountInUsd = amount / fromRate;
    const converted = amountInUsd * toRate;

    // Formatting rounding: JPY has 0 decimals, others standard 2
    return toCurrency === 'JPY' ? Math.round(converted) : Math.round(converted * 100) / 100;
  }

  // Real-time Display Formatter: Shows local converted price alongside provider base price
  formatPrice(amount: number, providerCurrency = 'USD', targetCurrency?: string): string {
    const target = targetCurrency || this.activeCurrency();
    const providerSymbol = this.getSymbol(providerCurrency);

    if (target === providerCurrency) {
      return `${providerSymbol}${amount.toLocaleString()}`;
    }

    const convertedAmount = this.convert(amount, providerCurrency, target);
    const targetSymbol = this.getSymbol(target);

    // E.g.: "₹20,750 (~$250 USD)" or "$250 (~₹20,750 INR)"
    return `${targetSymbol}${convertedAmount.toLocaleString()} (~${providerSymbol}${amount.toLocaleString()} ${providerCurrency})`;
  }
}
