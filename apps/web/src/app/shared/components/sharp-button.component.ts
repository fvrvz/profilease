import { Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

@Component({
  selector: 'app-sharp-button',
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      (click)="onClick($event)"
      [class]="buttonClasses()"
    >
      @if (loading()) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      }
      <ng-content />
    </button>
  `,
  host: {
    class: 'inline-block',
  },
})
export class SharpButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly fullWidth = input<boolean>(false);

  readonly btnClick = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.btnClick.emit(event);
    }
  }

  buttonClasses(): string {
    const base =
      'inline-flex items-center justify-center font-medium tracking-tight uppercase text-xs transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const sizes = {
      sm: 'px-3 py-1.5 text-[11px]',
      md: 'px-5 py-2.5 text-xs',
      lg: 'px-7 py-3.5 text-sm font-semibold',
    }[this.size()];

    const width = this.fullWidth() ? 'w-full' : '';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800 active:bg-black focus:ring-neutral-900',
      secondary:
        'bg-neutral-100 text-neutral-900 border-neutral-300 hover:bg-neutral-200 active:bg-neutral-300 focus:ring-neutral-400',
      outline:
        'bg-transparent text-neutral-900 border-neutral-900 hover:bg-neutral-900 hover:text-white focus:ring-neutral-900',
      danger:
        'bg-red-600 text-white border-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-600',
      ghost:
        'bg-transparent text-neutral-800 border-transparent hover:bg-neutral-100 focus:ring-neutral-400',
    };

    return `${base} ${sizes} ${width} ${variants[this.variant()]}`;
  }
}
