import { Component, inject } from '@angular/core';
import { ToastService } from '@service/toast.service';

@Component({
  selector: 'app-feedback-overlay',
  standalone: true,
  template: `
    <!-- Global Loading / Saving Progress Modal -->
    @if (toast.isBusy()) {
      <div
        class="fixed inset-0 z-[110] bg-neutral-950/45 backdrop-blur-[1px] flex items-center justify-center p-4"
        role="status"
        aria-live="polite"
      >
        <div class="bg-white border-2 border-neutral-900 px-6 py-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 max-w-sm w-full">
          <span class="w-5 h-5 border-2 border-neutral-900 border-t-transparent animate-spin shrink-0"></span>
          <div>
            <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 block">
              Processing
            </span>
            <p class="text-xs font-mono font-bold text-neutral-900 mt-0.5">
              {{ toast.busyMessage() }}
            </p>
          </div>
        </div>
      </div>
    }

    <!-- Global Toast Stack -->
    @if (toast.toasts().length > 0) {
      <div class="fixed bottom-5 right-5 z-[120] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none">
        @for (item of toast.toasts(); track item.id) {
          <div
            class="pointer-events-auto bg-white border-2 border-neutral-900 p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start justify-between gap-3 font-mono text-xs"
            [class.border-l-8]="true"
            [class.border-l-emerald-600]="item.type === 'success'"
            [class.border-l-red-600]="item.type === 'error'"
            [class.border-l-blue-600]="item.type === 'info'"
          >
            <div class="flex items-start gap-2.5">
              <span
                class="font-black uppercase text-[10px] px-1.5 py-0.5 border shrink-0"
                [class.bg-emerald-50]="item.type === 'success'"
                [class.text-emerald-800]="item.type === 'success'"
                [class.border-emerald-300]="item.type === 'success'"
                [class.bg-red-50]="item.type === 'error'"
                [class.text-red-800]="item.type === 'error'"
                [class.border-red-300]="item.type === 'error'"
                [class.bg-blue-50]="item.type === 'info'"
                [class.text-blue-800]="item.type === 'info'"
                [class.border-blue-300]="item.type === 'info'"
              >
                {{ item.type }}
              </span>
              <span class="text-neutral-900 leading-snug">{{ item.message }}</span>
            </div>
            <button
              type="button"
              (click)="toast.dismiss(item.id)"
              aria-label="Dismiss notification"
              class="text-neutral-500 hover:text-neutral-900 font-bold text-xs px-1 cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        }
      </div>
    }
  `,
})
export class FeedbackOverlayComponent {
  protected readonly toast = inject(ToastService);
}
