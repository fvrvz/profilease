import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

const DEFAULT_LOCAL_HOSTS = new Set<string>(['localhost', '127.0.0.1']);

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  hostname(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }
    return window.location.hostname.toLowerCase();
  }

  platformUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      const meta = this.document
        .querySelector('meta[name="profilease-platform-url"]')
        ?.getAttribute('content')
        ?.trim();
      if (meta) return meta;
    }
    return 'https://profilease.byfaraaz.com';
  }

  isCustomDomain(): boolean {
    const host = this.hostname();
    if (!host) {
      return false;
    }

    if (isPlatformBrowser(this.platformId)) {
      const meta = this.document
        .querySelector('meta[name="profilease-is-custom-domain"]')
        ?.getAttribute('content');
      if (meta === 'true') return true;
      if (meta === 'false') return false;
    }

    if (
      DEFAULT_LOCAL_HOSTS.has(host) ||
      host.endsWith('.workers.dev') ||
      host.endsWith('.pages.dev') ||
      host.endsWith('.github.io')
    ) {
      return false;
    }
    return true;
  }
}
