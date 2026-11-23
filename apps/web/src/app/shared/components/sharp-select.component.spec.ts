import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharpSelectComponent, SharpSelectOption } from './sharp-select.component';

describe('SharpSelectComponent', () => {
  let fixture: ComponentFixture<SharpSelectComponent>;
  let component: SharpSelectComponent;

  const mockOptions: readonly SharpSelectOption[] = [
    { value: 'doc', label: 'Doctor', sublabel: 'MD', icon: 'stethoscope' },
    { value: 'eng', label: 'Engineer', sublabel: 'Tech', icon: 'briefcase' },
    { value: 'tea', label: 'Teacher', sublabel: 'Edu', icon: 'graduation' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharpSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SharpSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', mockOptions);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle dropdown open and close', () => {
    expect(component.isOpen()).toBe(false);

    component.toggleOpen();
    expect(component.isOpen()).toBe(true);

    component.toggleOpen();
    expect(component.isOpen()).toBe(false);
  });

  it('should select an option and emit selectionChange', () => {
    let emitted = '';
    component.selectionChange.subscribe((val) => {
      emitted = val;
    });

    component.selectOption(mockOptions[1]);
    expect(component.value()).toBe('eng');
    expect(emitted).toBe('eng');
    expect(component.isOpen()).toBe(false);
  });

  it('should filter options by search query', () => {
    component.searchQuery.set('doc');
    expect(component.filteredOptions().length).toBe(1);
    expect(component.filteredOptions()[0].value).toBe('doc');

    component.searchQuery.set('xyz');
    expect(component.filteredOptions().length).toBe(0);
  });

  it('should close on escape key', () => {
    component.toggleOpen();
    expect(component.isOpen()).toBe(true);

    component.onEscape();
    expect(component.isOpen()).toBe(false);
  });
});
