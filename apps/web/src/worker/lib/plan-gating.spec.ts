import { describe, it, expect } from 'vitest';
import { validatePlanUpdate } from './plan-gating';
import type { ProfileRecord } from '../db/schema';

const baseProfile: ProfileRecord = {
  id: 'prof-1',
  slug: 'dr-test',
  name: 'Dr. Test',
  profession: 'doctor',
  title: 'MD',
  bio: 'Bio',
  avatarUrl: 'https://example.com/a.jpg',
  theme: 'medical-teal',
  customDomain: null,
  clientAccessKey: 'hash',
  mustChangePassword: 0,
  email: 'test@example.com',
  phone: '123',
  city: 'New York',
  country: 'US',
  currency: 'USD',
  timezone: 'UTC',
  credentials: '[]',
  socialLinks: '[]',
  location: 'NYC',
  clinicOrSchoolName: 'Clinic',
  aboutDetailed: 'Bio',
  timingsNote: '',
  emergencyNotice: null,
  serviceMode: 'clinic',
  testimonialsJson: '[]',
  googleReviewsUrl: null,
  subscriptionPlan: 'basic',
  subscriptionStatus: 'active',
  layoutVariant: 'classic',
  viewMode: 'portfolio',
  borderStyle: 'sharp',
  themeOverridesJson: null,
  customCss: null,
  hidePlatformBranding: 0,
  customDomainAddon: 0,
  extraServiceSlots: 0,
  passwordResetToken: null,
  passwordResetExpiresAt: null,
  createdAt: '2026-01-01',
};

describe('worker plan gating', () => {
  it('blocks layout switching and Google Reviews on basic plan', () => {
    expect(validatePlanUpdate(baseProfile, { layoutVariant: 'split-sidebar' })).toContain('Mid or Pro');
    expect(validatePlanUpdate(baseProfile, { googleReviewsUrl: 'https://g.page/test' })).toContain('Mid or Pro');
  });

  it('allows custom domain on basic only when customDomainAddon is enabled', () => {
    expect(validatePlanUpdate(baseProfile, { customDomain: 'abc.com' })).toContain('add-on');
    expect(validatePlanUpdate({ ...baseProfile, customDomainAddon: 1 }, { customDomain: 'abc.com' })).toBeNull();
  });

  it('allows custom CSS and 4 views on pro plan', () => {
    const proProfile: ProfileRecord = { ...baseProfile, subscriptionPlan: 'pro' };
    expect(
      validatePlanUpdate(proProfile, {
        layoutVariant: 'split-sidebar',
        viewMode: 'executive-dark',
        customCss: '.portfolio-root { color: red; }',
        hidePlatformBranding: true,
      })
    ).toBeNull();
  });
});
