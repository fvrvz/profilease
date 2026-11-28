import { getPlanCapabilities, normalizePlan } from '@profilease/types';

describe('Plan Capabilities', () => {
  it('normalizes unknown or legacy headless plans to basic', () => {
    expect(normalizePlan(undefined)).toBe('basic');
    expect(normalizePlan('headless')).toBe('basic');
    expect(normalizePlan('mid')).toBe('mid');
    expect(normalizePlan('pro')).toBe('pro');
  });

  it('enforces Basic tier capabilities with optional custom domain add-on', () => {
    const caps = getPlanCapabilities('basic');
    expect(caps.canSwitchThemeColors).toBe(true);
    expect(caps.canSwitchLayouts).toBe(false);
    expect(caps.allowedViews).toEqual(['portfolio']);
    expect(caps.canCustomizeCss).toBe(false);
    expect(caps.canPurchaseCustomDomainAddon).toBe(true);
    expect(caps.baseServiceLimit).toBe(5);
  });

  it('enforces Mid tier layouts, 2 views, and Google Reviews', () => {
    const caps = getPlanCapabilities('mid');
    expect(caps.canSwitchLayouts).toBe(true);
    expect(caps.allowedLayouts.length).toBe(3);
    expect(caps.allowedViews).toEqual(['portfolio', 'link-card']);
    expect(caps.includesGoogleReviews).toBe(true);
    expect(caps.canCustomizeCss).toBe(false);
  });

  it('enforces Pro tier full views, custom CSS, and white-label', () => {
    const caps = getPlanCapabilities('pro');
    expect(caps.allowedViews.length).toBe(4);
    expect(caps.canCustomizeCss).toBe(true);
    expect(caps.canCustomizeColors).toBe(true);
    expect(caps.canHideBranding).toBe(true);
  });
});
