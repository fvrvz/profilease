import type { ProfileRecord } from '../db/schema';

export interface PlanUpdatePayload {
  layoutVariant?: string;
  viewMode?: string;
  customCss?: string | null;
  themeOverrides?: Record<string, string> | null;
  hidePlatformBranding?: boolean;
  customDomain?: string | null;
  googleReviewsUrl?: string | null;
  services?: unknown[];
  testimonials?: unknown[];
}

export function validatePlanUpdate(current: ProfileRecord, body: PlanUpdatePayload): string | null {
  const plan =
    current.subscriptionPlan === 'mid' || current.subscriptionPlan === 'pro'
      ? current.subscriptionPlan
      : 'basic';
  const hasCustomDomainAddon = current.customDomainAddon === 1;
  const extraServiceSlots = current.extraServiceSlots || 0;
  const maxServices = (plan === 'pro' ? 999 : plan === 'mid' ? 15 : 5) + extraServiceSlots;
  const maxTestimonials = plan === 'basic' ? 3 : null;
  const allowedLayouts = plan === 'basic' ? ['classic'] : ['classic', 'split-sidebar', 'compact-grid'];
  const allowedViews =
    plan === 'pro'
      ? ['portfolio', 'link-card', 'editorial-magazine', 'executive-dark']
      : plan === 'mid'
        ? ['portfolio', 'link-card']
        : ['portfolio'];

  if (body.layoutVariant && !allowedLayouts.includes(body.layoutVariant)) {
    return `Layout '${body.layoutVariant}' requires Mid or Pro plan.`;
  }
  if (body.viewMode && !allowedViews.includes(body.viewMode)) {
    return `View mode '${body.viewMode}' is not included in your ${plan} plan.`;
  }
  if ((body.customCss !== undefined || body.themeOverrides !== undefined || body.hidePlatformBranding) && plan !== 'pro') {
    return 'Custom CSS, color overrides, and white-label branding require the Pro plan.';
  }
  if (body.customDomain && plan === 'basic' && !hasCustomDomainAddon) {
    return 'Custom domains on Basic require the Custom Domain add-on or an upgrade to Mid/Pro.';
  }
  if (body.googleReviewsUrl && plan === 'basic') {
    return 'Google Reviews integration requires Mid or Pro plan.';
  }
  if (Array.isArray(body.services) && body.services.length > maxServices) {
    return `Service limit (${maxServices}) reached for your current plan.`;
  }
  if (Array.isArray(body.testimonials) && maxTestimonials !== null && body.testimonials.length > maxTestimonials) {
    return `Testimonials limit (${maxTestimonials}) reached on Basic plan.`;
  }

  return null;
}
