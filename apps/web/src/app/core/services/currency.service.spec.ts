import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CurrencyService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CurrencyService);
  });

  it('should initialize with default currencies and rates', () => {
    expect(service).toBeTruthy();
    expect(service.currencyOptions().length).toBeGreaterThan(5);
    expect(service.rates()['USD']).toBe(1.0);
  });

  it('should return correct symbols for known currencies', () => {
    expect(service.getSymbol('USD')).toBe('$');
    expect(service.getSymbol('EUR')).toBe('€');
    expect(service.getSymbol('GBP')).toBe('£');
    expect(service.getSymbol('INR')).toBe('₹');
    expect(service.getSymbol('CAD')).toBe('C$');
  });

  it('should convert currency amounts correctly', () => {
    // 100 USD to INR at rate 84.5
    const converted = service.convert(100, 'USD', 'INR');
    expect(converted).toBe(8450);

    // Identity conversion
    expect(service.convert(150, 'USD', 'USD')).toBe(150);
  });

  it('should format price with converted and base currency when different', () => {
    const formatted = service.formatPrice(100, 'USD', 'INR');
    expect(formatted).toContain('₹8,450');
    expect(formatted).toContain('$100 USD');
  });

  it('should format price simply when target matches provider currency', () => {
    const formatted = service.formatPrice(100, 'USD', 'USD');
    expect(formatted).toBe('$100');
  });
});
