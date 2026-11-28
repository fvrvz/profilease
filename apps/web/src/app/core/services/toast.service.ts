import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  readonly id: number;
  readonly type: ToastType;
  readonly message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;

  readonly toasts = signal<readonly ToastItem[]>([]);
  readonly isBusy = signal<boolean>(false);
  readonly busyMessage = signal<string>('Saving changes...');

  startLoading(message = 'Saving changes...'): void {
    this.busyMessage.set(message);
    this.isBusy.set(true);
  }

  stopLoading(): void {
    this.isBusy.set(false);
  }

  showSuccess(message: string): void {
    this.addToast('success', message);
  }

  showError(message: string): void {
    this.addToast('error', message);
  }

  showInfo(message: string): void {
    this.addToast('info', message);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private addToast(type: ToastType, message: string): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4500);
  }
}
