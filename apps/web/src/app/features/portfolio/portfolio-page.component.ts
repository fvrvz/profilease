import { Component, input, signal, inject, OnInit, OnDestroy, effect, computed, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpperCasePipe, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ColorPreference, ServiceItem } from '@profilease/types';
import { ProfileService } from '@service/profile.service';
import { CurrencyService } from '@service/currency.service';
import { TenantContextService } from '@service/tenant-context.service';
import { SharpBadgeComponent } from '@shared/components/sharp-badge.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';
import { BookingWidgetComponent } from './components/booking-widget.component';

@Component({
  selector: 'app-portfolio-page',
  imports: [
    RouterLink,
    UpperCasePipe,
    SharpBadgeComponent,
    SharpIconComponent,
    BookingWidgetComponent,
  ],
  templateUrl: './portfolio-page.component.html',
})
export class PortfolioPageComponent implements OnInit, OnDestroy {
  // Input from route param :slug or custom domain host
  readonly slug = input<string>();
  readonly customDomainHost = input<string>();

  protected readonly profileService = inject(ProfileService);
  protected readonly currencyService = inject(CurrencyService);
  protected readonly tenantContext = inject(TenantContextService);
  private readonly titleService = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly selectedServiceId = signal<string>('');
  readonly profile = this.profileService.currentProfile;
  readonly colorPreference = signal<ColorPreference>('system');
  readonly systemPrefersDark = signal<boolean>(false);

  readonly isDarkMode = computed<boolean>(() => {
    const pref = this.colorPreference();
    if (pref === 'dark') return true;
    if (pref === 'light') return false;
    if (this.profile()?.viewMode === 'executive-dark') return true;
    return this.systemPrefersDark();
  });

  readonly isLinkCardView = computed<boolean>(() => this.profile()?.viewMode === 'link-card');
  readonly isSplitLayout = computed<boolean>(() => this.profile()?.layoutVariant === 'split-sidebar');
  readonly isCompactLayout = computed<boolean>(() => this.profile()?.layoutVariant === 'compact-grid');

  readonly customThemeStyle = computed<Record<string, string>>(() => {
    const p = this.profile();
    if (!p || p.subscriptionPlan !== 'pro' || !p.themeOverrides) return {};
    const ov = p.themeOverrides;
    const style: Record<string, string> = {};
    if (ov.accentColor) style['--pf-accent'] = ov.accentColor;
    if (ov.backgroundColor) style['--pf-bg'] = ov.backgroundColor;
    if (ov.surfaceColor) style['--pf-surface'] = ov.surfaceColor;
    if (ov.textColor) style['--pf-text'] = ov.textColor;
    if (ov.fontStyle === 'serif') style['font-family'] = 'Georgia, Cambria, serif';
    else if (ov.fontStyle === 'mono') style['font-family'] = 'var(--font-mono)';
    return style;
  });

  readonly safeCustomCss = computed<string>(() => {
    const p = this.profile();
    if (!p || p.subscriptionPlan !== 'pro' || !p.customCss) return '';
    return p.customCss
      .replace(/<\/style>/gi, '')
      .replace(/@import/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/javascript:/gi, '');
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('profilease_color_mode') as ColorPreference | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        this.colorPreference.set(saved);
      }
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark.set(mq.matches);
      mq.addEventListener('change', (e) => this.systemPrefersDark.set(e.matches));
    }

    effect(() => {
      const prof = this.profile();
      if (prof) {
        const suffix = this.tenantContext.isCustomDomain() ? '' : ' | Profilease';
        this.titleService.setTitle(`${prof.name} — ${prof.title}${suffix}`);
      }
      if (isPlatformBrowser(this.platformId)) {
        const styleId = 'profilease-pro-custom-css';
        let styleEl = this.document.getElementById(styleId) as HTMLStyleElement | null;
        const css = this.safeCustomCss();
        if (css) {
          if (!styleEl) {
            styleEl = this.document.createElement('style');
            styleEl.id = styleId;
            this.document.head.appendChild(styleEl);
          }
          styleEl.textContent = css;
        } else if (styleEl) {
          styleEl.remove();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.getElementById('profilease-pro-custom-css')?.remove();
    }
  }

  cycleColorPreference(): void {
    const order: ColorPreference[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(this.colorPreference()) + 1) % order.length];
    this.colorPreference.set(next);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('profilease_color_mode', next);
    }
  }

  ngOnInit(): void {
    const domainHost = this.customDomainHost();
    if (domainHost) {
      this.profileService.loadByCustomDomain(domainHost).subscribe();
      return;
    }
    const slugVal = this.slug();
    if (slugVal) {
      // Remove leading '@' if present from /@dr-smith
      const cleanSlug = slugVal.startsWith('@') ? slugVal.substring(1) : slugVal;
      this.profileService.getBySlugOrId(cleanSlug).subscribe();
    }
  }

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  selectServiceAndScroll(service: ServiceItem): void {
    this.selectedServiceId.set(service.id);
    const element = document.getElementById('booking-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  locationHeading(): string {
    switch (this.profile()?.serviceMode) {
      case 'home-visit':
        return 'Home Visit Service Area';
      case 'online':
        return 'Virtual Practice';
      case 'hybrid':
        return 'Office & Service Coverage';
      case 'clinic':
      default:
        return 'Office Location';
    }
  }

  serviceModeNote(): string | null {
    switch (this.profile()?.serviceMode) {
      case 'home-visit':
        return 'Mobile / Home-Visit Practice: Practitioner travels directly to your residence or care location.';
      case 'online':
        return '100% Online / Telehealth: Sessions are conducted remotely via secure video or phone.';
      case 'hybrid':
        return 'Hybrid Practice: Available for in-office appointments, home visits, and online consultations.';
      default:
        return null;
    }
  }

  themeClass(): string {
    const p = this.profile();
    const theme = p?.theme;
    let accent = 'accent-neutral';
    switch (theme) {
      case 'medical-teal':
        accent = 'accent-teal';
        break;
      case 'academic-indigo':
        accent = 'accent-indigo';
        break;
      case 'warm-amber':
        accent = 'accent-amber';
        break;
      case 'emerald-care':
        accent = 'accent-emerald';
        break;
      case 'crimson-bold':
        accent = 'accent-crimson';
        break;
      case 'editorial-obsidian':
      default:
        accent = 'accent-neutral';
        break;
    }
    const corners = p?.borderStyle === 'rounded' ? 'corners-rounded' : 'corners-sharp';
    const mode = this.isDarkMode() ? 'portfolio-dark' : 'portfolio-light';
    const layout = `layout-${p?.layoutVariant || 'classic'}`;
    const view = `view-${p?.viewMode || 'portfolio'}`;
    return `portfolio-root ${accent} ${corners} ${mode} ${layout} ${view}`;
  }

  badgeVariant(): 'teal' | 'indigo' | 'amber' | 'neutral' {
    const prof = this.profile()?.profession;
    switch (prof) {
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
