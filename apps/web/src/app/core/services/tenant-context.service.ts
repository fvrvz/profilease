import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const PLATFORM_HOSTS = new Set<string>([
  'localhost',
  '127.0.0.1',
  'profilease.byfaraaz.com',
  'www.profilease.byfaraaz.com',
  'profilease.io',
  'www.profilease.io',
]);

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private readonly platformId = inject(PLATFORM_ID);

  hostname(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }
    return window.location.hostname.toLowerCase();
  }

  isCustomDomain(): boolean {
    const host = this.hostname();
    if (!host) {
      return false;
    }
    if (
      PLATFORM_HOSTS.has(host) ||
      host.endsWith('.workers.dev') ||
      host.endsWith('.pages.dev') ||
      host.endsWith('.github.io')
    ) {
      return false;
    }
    return true;
  }
}
