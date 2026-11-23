import { Route, UrlMatcher, UrlSegment } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const atSlugMatcher: UrlMatcher = (segments: UrlSegment[]) => {
  if (segments.length === 1 && segments[0].path.startsWith('@')) {
    return {
      consumed: segments,
      posParams: {
        slug: new UrlSegment(segments[0].path.slice(1), {}),
      },
    };
  }
  return null;
};

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing-page.component').then(
        (m) => m.LandingPageComponent
      ),
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'onboard',
        loadComponent: () =>
          import('./features/admin/onboard/admin-onboard.component').then(
            (m) => m.AdminOnboardComponent
          ),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./features/admin/appointments/admin-appointments.component').then(
            (m) => m.AdminAppointmentsComponent
          ),
      },
      {
        path: 'domains',
        loadComponent: () =>
          import('./features/admin/domains/admin-domains.component').then(
            (m) => m.AdminDomainsComponent
          ),
      },
    ],
  },
  {
    matcher: atSlugMatcher,
    loadComponent: () =>
      import('./features/portfolio/portfolio-page.component').then(
        (m) => m.PortfolioPageComponent
      ),
  },
  {
    path: 'p/:slug',
    loadComponent: () =>
      import('./features/portfolio/portfolio-page.component').then(
        (m) => m.PortfolioPageComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
