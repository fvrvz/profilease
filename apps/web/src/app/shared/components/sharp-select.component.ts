import {
  Component,
  ElementRef,
  HostListener,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharpIconComponent, IconName } from './sharp-icon.component';

export interface SharpSelectOption {
  readonly value: string;
  readonly label: string;
  readonly sublabel?: string;
  readonly icon?: IconName;
  readonly badge?: string;
}

@Component({
  selector: 'app-sharp-select',
  standalone: true,
  imports: [CommonModule, FormsModule, SharpIconComponent],
  templateUrl: './sharp-select.component.html',
})
export class SharpSelectComponent {
  // Option list
  readonly options = input.required<readonly SharpSelectOption[]>();

  // Two-way binding value
  readonly value = model<string>('');

  // UI labels & placeholders
  readonly label = input<string>('');
  readonly placeholder = input<string>('Select an option...');
  readonly disabled = input<boolean>(false);
  readonly searchable = input<boolean>(true);
  readonly customClass = input<string>('');

  // Output event on selection
  readonly selectionChange = output<string>();

  // Internal state
  readonly isOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  constructor(private readonly elementRef: ElementRef) {}

  // Selected Option Object
  readonly selectedOption = computed(() => {
    const val = this.value();
    return this.options().find((o) => o.value === val) ?? null;
  });

  // Filtered Options for search
  readonly filteredOptions = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const opts = this.options();
    if (!q) return opts;

    return opts.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(q)) ||
        o.value.toLowerCase().includes(q)
    );
  });

  toggleOpen(): void {
    if (this.disabled()) return;
    const next = !this.isOpen();
    this.isOpen.set(next);
    if (!next) {
      this.searchQuery.set('');
    }
  }

  selectOption(opt: SharpSelectOption): void {
    this.value.set(opt.value);
    this.selectionChange.emit(opt.value);
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.searchQuery.set('');
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
  }
}
