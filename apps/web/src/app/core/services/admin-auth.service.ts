import { Service, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { AdminLoginDto, AdminAuthResponse } from '@profilease/types';

@Service()
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly TOKEN_KEY = 'profilease_admin_token';
  private readonly USER_KEY = 'profilease_admin_user';

  readonly isAuthenticated = signal<boolean>(false);
  readonly adminUser = signal<string | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const token = sessionStorage.getItem(this.TOKEN_KEY);
      const user = sessionStorage.getItem(this.USER_KEY);
      if (token) {
        this.isAuthenticated.set(true);
        this.adminUser.set(user || 'Admin');
      }
    }
  }

  login(dto: AdminLoginDto): Observable<AdminAuthResponse> {
    return this.http.post<AdminAuthResponse>('/api/admin/login', dto).pipe(
      tap((res) => {
        if (res.success) {
          this.isAuthenticated.set(true);
          this.adminUser.set(res.username);
          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem(this.TOKEN_KEY, res.token);
            sessionStorage.setItem(this.USER_KEY, res.username);
          }
        }
      }),
      catchError((err: unknown) => {
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.adminUser.set(null);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    }
    this.router.navigate(['/admin/login']);
  }
}
