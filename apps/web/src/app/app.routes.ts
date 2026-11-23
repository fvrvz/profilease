import { Route, UrlMatcher, UrlSegment } from '@angular/router';
import { adminGuard } from '@guards/admin.guard';
import { clientGuard } from '@guards/client.guard';

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
      import('@features/landing/landing-page.component').then(
        (m) => m.LandingPageComponent
      ),
  },
  // --- Admin Portal (Onboarding & Client Directory Only) ---
  {
    path: 'admin/login',
    loadComponent: () =>
      import('@features/admin/login/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('@features/admin/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'onboard',
        loadComponent: () =>
          import('@features/admin/onboard/admin-onboard.component').then(
            (m) => m.AdminOnboardComponent
          ),
      },
      {
        path: 'domains',
        loadComponent: () =>
          import('@features/admin/domains/admin-domains.component').then(
            (m) => m.AdminDomainsComponent
          ),
      },
      {
        path: 'appointments',
        redirectTo: '',
      },
    ],
  },
  // --- Client Self-Service Portal (Appointments, Services, Timings, Availability) ---
  {
    path: 'portal/login',
    loadComponent: () =>
      import('@features/portal/portal-login.component').then(
        (m) => m.PortalLoginComponent
      ),
  },
  {
    path: 'portal',
    canActivate: [clientGuard],
    loadComponent: () =>
      import('@features/portal/portal-layout.component').then(
        (m) => m.PortalLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@features/portal/portal-appointments.component').then(
            (m) => m.PortalAppointmentsComponent
          ),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('@features/portal/portal-appointments.component').then(
            (m) => m.PortalAppointmentsComponent
          ),
      },
      {
        path: 'services',
        loadComponent: () =>
          import('@features/portal/portal-services.component').then(
            (m) => m.PortalServicesComponent
          ),
      },
      {
        path: 'availability',
        loadComponent: () =>
          import('@features/portal/portal-availability.component').then(
            (m) => m.PortalAvailabilityComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('@features/portal/portal-profile.component').then(
            (m) => m.PortalProfileComponent
          ),
      },
    ],
  },
  // --- Public Portfolio Routes ---
  {
    matcher: atSlugMatcher,
    loadComponent: () =>
      import('@features/portfolio/portfolio-page.component').then(
        (m) => m.PortfolioPageComponent
      ),
  },
  {
    path: 'p/:slug',
    loadComponent: () =>
      import('@features/portfolio/portfolio-page.component').then(
        (m) => m.PortfolioPageComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
