import { Service, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  AppointmentBooking,
  CreateAppointmentDto,
  AppointmentStatus,
} from '@profilease/types';

@Service()
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private get baseUrl(): string {
    if (isPlatformServer(this.platformId)) {
      const port = process.env['PORT'] || 4000;
      return `http://127.0.0.1:${port}/api/appointments`;
    }
    return '/api/appointments';
  }

  // Signals
  readonly appointments = signal<readonly AppointmentBooking[]>([]);
  readonly isSubmitting = signal<boolean>(false);
  readonly latestBooking = signal<AppointmentBooking | null>(null);
  readonly errorMessage = signal<string | null>(null);

  loadAll(profileId?: string): Observable<readonly AppointmentBooking[]> {
    const url = profileId ? `${this.baseUrl}?profileId=${profileId}` : this.baseUrl;
    return this.http.get<readonly AppointmentBooking[]>(url).pipe(
      tap((data) => this.appointments.set(data)),
      catchError((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to fetch appointments';
        this.errorMessage.set(msg);
        return throwError(() => err);
      })
    );
  }

  loadForClient(profileId: string): Observable<readonly AppointmentBooking[]> {
    const url = `/api/client/appointments?profileId=${encodeURIComponent(profileId)}`;
    return this.http.get<readonly AppointmentBooking[]>(url).pipe(
      tap((data) => this.appointments.set(data)),
      catchError((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to fetch appointments';
        this.errorMessage.set(msg);
        return throwError(() => err);
      })
    );
  }

  book(dto: CreateAppointmentDto): Observable<AppointmentBooking> {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    return this.http.post<AppointmentBooking>(this.baseUrl, dto).pipe(
      tap((booking) => {
        this.latestBooking.set(booking);
        this.appointments.update((prev) => [booking, ...prev]);
        this.isSubmitting.set(false);
      }),
      catchError((err: unknown) => {
        this.isSubmitting.set(false);
        const msg = err instanceof Error ? err.message : 'Failed to book appointment';
        this.errorMessage.set(msg);
        return throwError(() => err);
      })
    );
  }

  updateClientAppointmentStatus(id: string, status: AppointmentStatus): Observable<AppointmentBooking> {
    return this.http.patch<AppointmentBooking>(`/api/client/appointments/${id}/status`, { status }).pipe(
      tap((updated) => {
        this.appointments.update((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
      })
    );
  }

  clearLatestBooking(): void {
    this.latestBooking.set(null);
  }
}
