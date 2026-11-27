import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlSegment } from '@angular/router';
import { portfolioSlugMatcher } from './app.routes';
import { customDomainGuard } from '@guards/custom-domain.guard';
import { TenantContextService } from '@service/tenant-context.service';

describe('portfolioSlugMatcher', () => {
  it('matches /@slug and strips leading @', () => {
    const result = portfolioSlugMatcher([new UrlSegment('@dr-elena-vance', {})], {} as never, {} as never);
    expect(result).not.toBeNull();
    expect(result?.posParams?.['slug']?.path).toBe('dr-elena-vance');
  });

  it('matches bare /slug without @', () => {
    const result = portfolioSlugMatcher([new UrlSegment('dr-elena-vance', {})], {} as never, {} as never);
    expect(result).not.toBeNull();
    expect(result?.posParams?.['slug']?.path).toBe('dr-elena-vance');
  });

  it('ignores reserved platform paths and file-like segments', () => {
    expect(portfolioSlugMatcher([new UrlSegment('admin', {})], {} as never, {} as never)).toBeNull();
    expect(portfolioSlugMatcher([new UrlSegment('portal', {})], {} as never, {} as never)).toBeNull();
    expect(portfolioSlugMatcher([new UrlSegment('favicon.ico', {})], {} as never, {} as never)).toBeNull();
    expect(portfolioSlugMatcher([new UrlSegment('@', {})], {} as never, {} as never)).toBeNull();
  });

  it('ignores multi-segment paths', () => {
    const result = portfolioSlugMatcher(
      [new UrlSegment('admin', {}), new UrlSegment('login', {})],
      {} as never,
      {} as never
    );
    expect(result).toBeNull();
  });
});

describe('customDomainGuard', () => {
  it('allows navigation on platform hosts', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: TenantContextService,
          useValue: { isCustomDomain: () => false },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      customDomainGuard({} as never, {} as never)
    );
    expect(result).toBe(true);
  });

  it('redirects to root on custom domains', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: TenantContextService,
          useValue: { isCustomDomain: () => true },
        },
      ],
    });

    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() =>
      customDomainGuard({} as never, {} as never)
    );
    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/');
  });
});
