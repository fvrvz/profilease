import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';

/** Available locales shown in the language picker. */
const LOCALES = [
  { code: 'en', label: 'EN', display: 'English' },
  { code: 'hi', label: 'HI', display: 'हिंदी' },
] as const;

type LangCode = (typeof LOCALES)[number]['code'];

/**
 * Compact language-switcher pill shown in app headers.
 * Persists selection to localStorage and applies it on mount.
 */
@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  template: `
    <div class="flex items-center gap-0.5 border border-neutral-700 p-0.5 font-mono text-[10px] font-bold uppercase">
      @for (locale of locales; track locale.code) {
        <button
          type="button"
          (click)="setLang(locale.code)"
          [title]="locale.display"
          class="px-2 py-1 transition-colors cursor-pointer"
          [class.bg-white]="activeLang() === locale.code"
          [class.text-neutral-900]="activeLang() === locale.code"
          [class.text-neutral-400]="activeLang() !== locale.code"
          [class.hover:text-white]="activeLang() !== locale.code"
        >
          {{ locale.label }}
        </button>
      }
    </div>
  `,
})
export class LangSwitcherComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly locales = LOCALES;
  readonly activeLang = signal<LangCode>('en');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('profilease_lang') as LangCode | null;
      const browser = navigator.language?.split('-')[0] as LangCode;
      const initial: LangCode =
        saved ?? (this.isSupported(browser) ? browser : 'en');
      this.activeLang.set(initial);
      this.transloco.setActiveLang(initial);
    }
  }

  setLang(code: LangCode): void {
    this.activeLang.set(code);
    this.transloco.setActiveLang(code);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('profilease_lang', code);
    }
  }

  private isSupported(code: string): code is LangCode {
    return this.locales.some((l) => l.code === code);
  }
}
