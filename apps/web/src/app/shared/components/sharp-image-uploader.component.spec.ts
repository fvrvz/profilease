import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SharpImageUploaderComponent } from './sharp-image-uploader.component';

describe('SharpImageUploaderComponent', () => {
  let fixture: ComponentFixture<SharpImageUploaderComponent>;
  let component: SharpImageUploaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharpImageUploaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SharpImageUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the uploader component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to "url" tab mode', () => {
    expect(component.activeTab()).toBe('url');
  });

  it('should switch between "url" and "upload" modes', () => {
    component.setTab('upload');
    expect(component.activeTab()).toBe('upload');

    component.setTab('url');
    expect(component.activeTab()).toBe('url');
  });

  it('should update direct URL input and emit on clear', () => {
    component.onUrlInput('https://example.com/photo.jpg');
    expect(component.directUrlInput()).toBe('https://example.com/photo.jpg');

    let emitted = 'init';
    component.imageChanged.subscribe((val) => {
      emitted = val;
    });

    component.clearImage();
    expect(component.directUrlInput()).toBe('');
    expect(component.imageUrl()).toBe('');
    expect(emitted).toBe('');
  });

  it('should adjust zoom within bounds', () => {
    component.resetTransform();
    expect(component.zoom()).toBe(1);

    component.zoomIn();
    expect(component.zoom()).toBe(1.1);

    component.zoomOut();
    expect(component.zoom()).toBe(1);
  });

  it('should adjust pan offset on nudge', () => {
    component.resetTransform();
    expect(component.panX()).toBe(0);
    expect(component.panY()).toBe(0);

    component.nudge(10, -20);
    expect(component.panX()).toBe(10);
    expect(component.panY()).toBe(-20);

    component.resetTransform();
    expect(component.panX()).toBe(0);
    expect(component.panY()).toBe(0);
  });

  it('should render mandatory warning when imageUrl is empty', () => {
    fixture.componentRef.setInput('imageUrl', '');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('IMAGE REQUIRED');
    expect(compiled.textContent).toContain('Avatar image is mandatory');
  });

  it('should render checkmark badge when imageUrl is set', () => {
    fixture.componentRef.setInput('imageUrl', 'https://example.com/avatar.jpg');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('AVATAR SET');
  });
});
