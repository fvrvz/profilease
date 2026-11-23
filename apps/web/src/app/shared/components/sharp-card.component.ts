import { Component, input } from '@angular/core';

@Component({
  selector: 'app-sharp-card',
  template: `
    <div
      class="bg-white border transition-all duration-150"
      [class]="cardClasses()"
    >
      @if (title()) {
        <div class="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/60">
          <h3 class="text-xs uppercase font-bold tracking-wider text-neutral-800">{{ title() }}</h3>
          <ng-content select="[card-header-actions]" />
        </div>
      }
      <div [class]="bodyPadding()">
        <ng-content />
      </div>
      <ng-content select="[card-footer]" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class SharpCardComponent {
  readonly title = input<string>();
  readonly bordered = input<boolean>(true);
  readonly elevated = input<boolean>(false);
  readonly accentBorder = input<'none' | 'teal' | 'indigo' | 'amber' | 'neutral'>('none');
  readonly bodyPadding = input<string>('p-5');

  cardClasses(): string {
    const borders = this.bordered() ? 'border-neutral-200' : 'border-transparent';
    const shadows = this.elevated() ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,0.08)]' : '';

    const accents: Record<string, string> = {
      none: '',
      teal: 'border-l-4 border-l-teal-600',
      indigo: 'border-l-4 border-l-indigo-600',
      amber: 'border-l-4 border-l-amber-500',
      neutral: 'border-l-4 border-l-neutral-900',
    };

    return `${borders} ${shadows} ${accents[this.accentBorder()] || ''}`;
  }
}
