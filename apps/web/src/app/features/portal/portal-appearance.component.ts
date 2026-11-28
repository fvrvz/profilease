import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BorderStyle,
  LayoutVariant,
  PortfolioViewMode,
  ThemeVariant,
  getPlanCapabilities,
} from '@profilease/types';
import { ClientAuthService } from '@service/client-auth.service';
import { ToastService } from '@service/toast.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';

interface ThemeOption {
  readonly id: ThemeVariant;
  readonly label: string;
  readonly swatch: string;
}

@Component({
  selector: 'app-portal-appearance',
  imports: [RouterLink, SharpButtonComponent],
  template: `
    <div class="space-y-8 font-sans">
      <!-- Page Header (aligned with other portal screens) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-neutral-900 pb-4">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-neutral-500 block">
            Appearance &amp; Theme Studio
          </span>
          <h1 class="text-2xl font-black uppercase tracking-tight text-neutral-900">
            Theme, Layout &amp; Custom Styling
          </h1>
          <p class="text-xs font-mono text-neutral-600 mt-1">
            Visitors can also toggle Light / Dark / System mode directly on your portfolio.
          </p>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <span class="px-3 py-2 bg-neutral-900 text-white font-mono text-xs font-bold uppercase tracking-wider">
            Plan: {{ capabilities().label }}
          </span>
          <a
            routerLink="/portal/plan"
            class="px-3 py-2 bg-white hover:bg-neutral-900 hover:text-white text-neutral-900 border-2 border-neutral-900 font-mono text-xs font-bold uppercase transition-colors"
          >
            Change Plan &rarr;
          </a>
        </div>
      </div>

      <!-- 1. Theme Colors & Border Corners (ALL PLANS) -->
      <div class="bg-white border-2 border-neutral-900 p-6 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-black uppercase tracking-wider text-neutral-900">
              1. Theme Color Palette
            </h2>
            <span class="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400 font-bold">
              Included in All Plans
            </span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            @for (t of themeOptions; track t.id) {
              <button
                type="button"
                (click)="selectedTheme.set(t.id)"
                class="p-3 border-2 text-left flex items-center gap-3 cursor-pointer transition-all"
                [class.border-neutral-900]="selectedTheme() === t.id"
                [class.bg-neutral-900]="selectedTheme() === t.id"
                [class.text-white]="selectedTheme() === t.id"
                [class.border-neutral-300]="selectedTheme() !== t.id"
              >
                <span class="w-5 h-5 shrink-0 border border-white/40" [style.background-color]="t.swatch"></span>
                <span class="text-xs font-mono font-bold uppercase">{{ t.label }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Border Corners (ALL PLANS) -->
        <div class="border-t border-neutral-200 pt-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-black uppercase tracking-wider text-neutral-900">
              2. Border Corners Style
            </h2>
            <span class="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400 font-bold">
              Included in All Plans
            </span>
          </div>
          <div class="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              (click)="selectedBorderStyle.set('sharp')"
              class="p-3 border-2 text-xs font-mono font-bold uppercase cursor-pointer"
              [class.border-neutral-900]="selectedBorderStyle() === 'sharp'"
              [class.bg-neutral-900]="selectedBorderStyle() === 'sharp'"
              [class.text-white]="selectedBorderStyle() === 'sharp'"
              [class.border-neutral-300]="selectedBorderStyle() !== 'sharp'"
            >
              ■ Sharp (0px Brutalist)
            </button>
            <button
              type="button"
              (click)="selectedBorderStyle.set('rounded')"
              class="p-3 border-2 text-xs font-mono font-bold uppercase cursor-pointer"
              [class.border-neutral-900]="selectedBorderStyle() === 'rounded'"
              [class.bg-neutral-900]="selectedBorderStyle() === 'rounded'"
              [class.text-white]="selectedBorderStyle() === 'rounded'"
              [class.border-neutral-300]="selectedBorderStyle() !== 'rounded'"
            >
              ● Rounded (Soft Cards)
            </button>
          </div>
        </div>
      </div>

      <!-- 2. Layout & View Switching (MID & PRO) -->
      <div class="bg-white border-2 border-neutral-900 p-6 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-black uppercase tracking-wider text-neutral-900">
              3. Layout Structure
            </h2>
            @if (!capabilities().canSwitchLayouts) {
              <span class="text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 font-bold">
                Mid / Pro Plan Required
              </span>
            }
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            @for (lay of layoutOptions; track lay.id) {
              @let unlocked = capabilities().allowedLayouts.includes(lay.id);
              <button
                type="button"
                [disabled]="!unlocked"
                (click)="selectedLayout.set(lay.id)"
                class="p-4 border-2 text-left transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                [class.border-neutral-900]="selectedLayout() === lay.id"
                [class.bg-neutral-900]="selectedLayout() === lay.id"
                [class.text-white]="selectedLayout() === lay.id"
                [class.border-neutral-300]="selectedLayout() !== lay.id"
              >
                <div class="flex items-center justify-between mb-1">
                  <strong class="text-xs font-mono uppercase">{{ lay.label }}</strong>
                  @if (!unlocked) {
                    <span class="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-neutral-200 text-neutral-800">MID+</span>
                  }
                </div>
                <p class="text-[11px] font-mono opacity-80">{{ lay.desc }}</p>
              </button>
            }
          </div>
        </div>

        <div class="border-t border-neutral-200 pt-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-black uppercase tracking-wider text-neutral-900">
              4. Portfolio View Mode
            </h2>
            <span class="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300 font-bold">
              Mid: 2 Views · Pro: All 4 Views
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            @for (v of viewOptions; track v.id) {
              @let unlocked = capabilities().allowedViews.includes(v.id);
              <button
                type="button"
                [disabled]="!unlocked"
                (click)="selectedView.set(v.id)"
                class="p-4 border-2 text-left transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                [class.border-neutral-900]="selectedView() === v.id"
                [class.bg-neutral-900]="selectedView() === v.id"
                [class.text-white]="selectedView() === v.id"
                [class.border-neutral-300]="selectedView() !== v.id"
              >
                <div class="flex items-center justify-between mb-1">
                  <strong class="text-xs font-mono uppercase">{{ v.label }}</strong>
                  @if (!unlocked) {
                    <span class="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-neutral-200 text-neutral-800">{{ v.tier }}</span>
                  }
                </div>
                <p class="text-[11px] font-mono opacity-80">{{ v.desc }}</p>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- 3. Pro Custom Colors, Fonts, White-Label & Custom CSS -->
      <div class="bg-white border-2 border-neutral-900 p-6 space-y-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-black uppercase tracking-wider text-neutral-900">
              5. Pro Custom Styling, White-Label &amp; Custom CSS
            </h2>
            <p class="text-xs font-mono text-neutral-500 mt-0.5">
              Override palette colors, typography, footer branding, and inject scoped CSS.
            </p>
          </div>
          @if (!capabilities().canCustomizeCss) {
            <span class="text-[10px] font-mono uppercase px-2.5 py-1 bg-neutral-900 text-white font-bold">
              PRO ONLY
            </span>
          }
        </div>

        <div [class.opacity-50]="!capabilities().canCustomizeCss" [class.pointer-events-none]="!capabilities().canCustomizeCss" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <label class="block font-bold uppercase mb-1">Custom Accent Hex</label>
              <input
                type="text"
                [value]="customAccent()"
                (input)="onTextInput(customAccent, $event)"
                placeholder="#0f766e"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white"
              />
            </div>
            <div>
              <label class="block font-bold uppercase mb-1">Custom Background Hex</label>
              <input
                type="text"
                [value]="customBg()"
                (input)="onTextInput(customBg, $event)"
                placeholder="#fafafa"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white"
              />
            </div>
            <div>
              <label class="block font-bold uppercase mb-1">Typography Style</label>
              <select
                [value]="customFont()"
                (change)="onTextInput(customFont, $event)"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white"
              >
                <option value="sans">Modern Sans (Inter)</option>
                <option value="serif">Editorial Serif (Georgia)</option>
                <option value="mono">Technical Mono</option>
              </select>
            </div>
          </div>

          <label class="flex items-center gap-2 text-xs font-mono font-bold cursor-pointer">
            <input
              type="checkbox"
              [checked]="hideBranding()"
              (change)="hideBranding.set(!hideBranding())"
              class="w-4 h-4 accent-neutral-900"
            />
            <span>White-Label: Hide "Generated with Profilease" footer link</span>
          </label>

          <div>
            <label class="block text-xs font-mono font-bold uppercase mb-1">
              Scoped Custom CSS (applied inside .portfolio-root)
            </label>
            <textarea
              rows="4"
              [value]="customCss()"
              (input)="onTextInput(customCss, $event)"
              placeholder=".portfolio-root h1 { letter-spacing: 0.04em; }"
              class="w-full px-3 py-2 border-2 border-neutral-900 bg-neutral-50 text-xs font-mono focus:outline-none"
            ></textarea>
          </div>
        </div>
      </div>

      @if (errorMessage()) {
        <div class="p-3 bg-red-100 border border-red-500 text-red-900 text-xs font-mono">
          {{ errorMessage() }}
        </div>
      }

      <div class="flex items-center justify-between">
        @if (saveSuccess()) {
          <span class="text-xs font-mono font-bold text-emerald-700">
            ✓ Appearance settings saved live!
          </span>
        } @else {
          <span></span>
        }
        <app-sharp-button type="button" variant="primary" (btnClick)="onSave()" [disabled]="isSaving()">
          {{ isSaving() ? 'Saving...' : 'Save Appearance Settings →' }}
        </app-sharp-button>
      </div>
    </div>
  `,
})
export class PortalAppearanceComponent implements OnInit {
  private readonly clientAuth = inject(ClientAuthService);
  private readonly toast = inject(ToastService);

  readonly currentProfile = this.clientAuth.currentProfile;
  readonly capabilities = computed(() => getPlanCapabilities(this.currentProfile()?.subscriptionPlan));

  readonly selectedTheme = signal<ThemeVariant>('medical-teal');
  readonly selectedBorderStyle = signal<BorderStyle>('sharp');
  readonly selectedLayout = signal<LayoutVariant>('classic');
  readonly selectedView = signal<PortfolioViewMode>('portfolio');
  readonly customAccent = signal<string>('');
  readonly customBg = signal<string>('');
  readonly customFont = signal<string>('sans');
  readonly hideBranding = signal<boolean>(false);
  readonly customCss = signal<string>('');

  readonly isSaving = signal<boolean>(false);
  readonly saveSuccess = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly themeOptions: readonly ThemeOption[] = [
    { id: 'medical-teal', label: 'Medical Teal', swatch: '#0f766e' },
    { id: 'academic-indigo', label: 'Academic Indigo', swatch: '#4338ca' },
    { id: 'warm-amber', label: 'Warm Amber', swatch: '#b45309' },
    { id: 'emerald-care', label: 'Emerald Care', swatch: '#047857' },
    { id: 'crimson-bold', label: 'Crimson Bold', swatch: '#b91c1c' },
    { id: 'editorial-obsidian', label: 'Obsidian', swatch: '#18181b' },
  ];

  readonly layoutOptions: readonly { id: LayoutVariant; label: string; desc: string }[] = [
    { id: 'classic', label: 'Classic Stack', desc: 'Full-width hero, services grid, and booking.' },
    { id: 'split-sidebar', label: 'Split Sticky', desc: '2-column layout with sticky booking panel.' },
    { id: 'compact-grid', label: 'Compact Grid', desc: 'Tighter spacing for dense service lists.' },
  ];

  readonly viewOptions: readonly { id: PortfolioViewMode; label: string; desc: string; tier: string }[] = [
    { id: 'portfolio', label: 'Full Portfolio', desc: 'Complete multi-section practitioner site.', tier: 'BASIC' },
    { id: 'link-card', label: 'Link-Card Bio', desc: 'Streamlined centered card + instant booking.', tier: 'MID+' },
    { id: 'editorial-magazine', label: 'Editorial Magazine', desc: 'Serif editorial typography & layout.', tier: 'PRO' },
    { id: 'executive-dark', label: 'Executive Dark', desc: 'Default dark executive presentation.', tier: 'PRO' },
  ];

  ngOnInit(): void {
    const p = this.currentProfile();
    if (!p) return;
    this.selectedTheme.set(p.theme || 'medical-teal');
    this.selectedBorderStyle.set(p.borderStyle || 'sharp');
    this.selectedLayout.set(p.layoutVariant || 'classic');
    this.selectedView.set(p.viewMode || 'portfolio');
    this.customAccent.set(p.themeOverrides?.accentColor || '');
    this.customBg.set(p.themeOverrides?.backgroundColor || '');
    this.customFont.set(p.themeOverrides?.fontStyle || 'sans');
    this.hideBranding.set(Boolean(p.hidePlatformBranding));
    this.customCss.set(p.customCss || '');
  }

  onTextInput(target: { set: (val: string) => void }, event: Event): void {
    target.set((event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value);
  }

  onSave(): void {
    this.errorMessage.set(null);
    this.saveSuccess.set(false);
    this.isSaving.set(true);
    this.toast.startLoading('Saving appearance settings...');

    const caps = this.capabilities();
    const payload: Record<string, unknown> = {
      theme: this.selectedTheme(),
      borderStyle: this.selectedBorderStyle(),
    };

    if (caps.canSwitchLayouts) {
      payload['layoutVariant'] = this.selectedLayout();
    }
    if (caps.allowedViews.includes(this.selectedView())) {
      payload['viewMode'] = this.selectedView();
    }
    if (caps.canCustomizeCss) {
      payload['themeOverrides'] = {
        accentColor: this.customAccent().trim() || undefined,
        backgroundColor: this.customBg().trim() || undefined,
        fontStyle: this.customFont() as 'sans' | 'serif' | 'mono',
      };
      payload['customCss'] = this.customCss();
      payload['hidePlatformBranding'] = this.hideBranding();
    }

    this.clientAuth.updateProfile(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.stopLoading();
        this.saveSuccess.set(true);
        this.toast.showSuccess('Appearance settings saved!');
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err: unknown) => {
        this.isSaving.set(false);
        this.toast.stopLoading();
        const msg = (err as { error?: { error?: string } })?.error?.error || 'Failed to save appearance settings.';
        this.errorMessage.set(msg);
        this.toast.showError(msg);
      },
    });
  }
}
