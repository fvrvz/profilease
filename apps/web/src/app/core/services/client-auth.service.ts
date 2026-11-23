import { Service, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ClientLoginDto, ClientAuthResponse, UserProfile, UpdateProfileDto } from '@profilease/types';

@Service()
export class ClientAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly TOKEN_KEY = 'profilease_client_token';
  private readonly PROFILE_KEY = 'profilease_client_profile';

  readonly isAuthenticated = signal<boolean>(false);
  readonly currentProfile = signal<UserProfile | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const profileJson = localStorage.getItem(this.PROFILE_KEY);
      if (token && profileJson) {
        try {
          const profile = JSON.parse(profileJson) as UserProfile;
          this.isAuthenticated.set(true);
          this.currentProfile.set(profile);
        } catch {
          this.logout();
        }
      }
    }
  }

  login(dto: ClientLoginDto): Observable<ClientAuthResponse> {
    return this.http.post<ClientAuthResponse>('/api/client/login', dto).pipe(
      tap((res) => {
        if (res.success && res.profile) {
          this.isAuthenticated.set(true);
          this.currentProfile.set(res.profile);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.TOKEN_KEY, res.token);
            localStorage.setItem(this.PROFILE_KEY, JSON.stringify(res.profile));
          }
        }
      }),
      catchError((err: unknown) => throwError(() => err))
    );
  }

  updateProfile(dto: Partial<UpdateProfileDto>): Observable<UserProfile> {
    const profile = this.currentProfile();
    const fullDto: UpdateProfileDto = {
      ...dto,
      id: profile ? profile.id : (dto.id || ''),
    };

    return this.http.put<UserProfile>('/api/client/profile', fullDto).pipe(
      tap((updated) => {
        this.currentProfile.set(updated);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.PROFILE_KEY, JSON.stringify(updated));
        }
      })
    );
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.currentProfile.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.PROFILE_KEY);
    }
    this.router.navigate(['/portal/login']);
  }
}
