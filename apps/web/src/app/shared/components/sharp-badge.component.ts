import { Component, input } from '@angular/core';

export type BadgeVariant = 'neutral' | 'teal' | 'indigo' | 'amber' | 'green' | 'red';

@Component({
  selector: 'app-sharp-badge',
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border select-none"
      [class]="badgeClasses()"
    >
      <ng-content />
    </span>
  `,
  host: {
    class: 'inline-block',
  },
})
export class SharpBadgeComponent {
  readonly variant = input<BadgeVariant>('neutral');

  badgeClasses(): string {
    const variants: Record<BadgeVariant, string> = {
      neutral: 'bg-neutral-100 text-neutral-800 border-neutral-300',
      teal: 'bg-teal-50 text-teal-800 border-teal-200',
      indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      amber: 'bg-amber-50 text-amber-800 border-amber-200',
      green: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      red: 'bg-red-50 text-red-800 border-red-200',
    };
    return variants[this.variant()];
  }
}
