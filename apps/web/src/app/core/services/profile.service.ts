import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  UserProfile,
  CreateProfileDto,
  UpdateProfileDto,
  DomainResolutionResponse,
} from '@profilease/types';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private get baseUrl(): string {
    if (isPlatformServer(this.platformId)) {
      const port = process.env['PORT'] || 4000;
      return `http://127.0.0.1:${port}/api/profiles`;
    }
    return '/api/profiles';
  }

  // Signals
  readonly profiles = signal<readonly UserProfile[]>([]);
  readonly currentProfile = signal<UserProfile | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  loadAll(): Observable<readonly UserProfile[]> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.get<readonly UserProfile[]>(this.baseUrl).pipe(
      tap((data) => {
        this.profiles.set(data);
        this.isLoading.set(false);
      }),
      catchError((err: unknown) => {
        this.isLoading.set(false);
        const msg = err instanceof Error ? err.message : 'Failed to load profiles';
        this.errorMessage.set(msg);
        return throwError(() => err);
      })
    );
  }

  getBySlugOrId(identifier: string): Observable<UserProfile> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.get<UserProfile>(`${this.baseUrl}/${identifier}`).pipe(
      tap((profile) => {
        this.currentProfile.set(profile);
        this.isLoading.set(false);
      }),
      catchError((err: unknown) => {
        this.isLoading.set(false);
        const msg = err instanceof Error ? err.message : `Failed to load profile '${identifier}'`;
        this.errorMessage.set(msg);
        return throwError(() => err);
      })
    );
  }

  create(dto: CreateProfileDto): Observable<UserProfile> {
    this.isLoading.set(true);
    return this.http.post<UserProfile>(this.baseUrl, dto).pipe(
      tap((created) => {
        this.profiles.update((prev) => [created, ...prev]);
        this.isLoading.set(false);
      }),
      catchError((err: unknown) => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  update(dto: UpdateProfileDto): Observable<UserProfile> {
    this.isLoading.set(true);
    return this.http.put<UserProfile>(`${this.baseUrl}/${dto.id}`, dto).pipe(
      tap((updated) => {
        this.profiles.update((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        if (this.currentProfile()?.id === updated.id) {
          this.currentProfile.set(updated);
        }
        this.isLoading.set(false);
      }),
      catchError((err: unknown) => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    this.isLoading.set(true);
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.profiles.update((prev) => prev.filter((p) => p.id !== id));
        if (this.currentProfile()?.id === id) {
          this.currentProfile.set(null);
        }
        this.isLoading.set(false);
      }),
      catchError((err: unknown) => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  resolveCustomDomain(host: string): Observable<DomainResolutionResponse> {
    const base = isPlatformServer(this.platformId)
      ? `http://127.0.0.1:${process.env['PORT'] || 4000}`
      : '';
    return this.http.get<DomainResolutionResponse>(`${base}/api/resolve-domain?host=${encodeURIComponent(host)}`);
  }
}
