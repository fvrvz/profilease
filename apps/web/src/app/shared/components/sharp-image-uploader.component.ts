import {
  Component,
  ElementRef,
  ViewChild,
  signal,
  model,
  input,
  output,
  inject,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SharpButtonComponent } from './sharp-button.component';
import { SharpIconComponent } from './sharp-icon.component';

export interface UploadResponse {
  readonly success: boolean;
  readonly key: string;
  readonly url: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
}

@Component({
  selector: 'app-sharp-image-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule, SharpButtonComponent, SharpIconComponent],
  templateUrl: './sharp-image-uploader.component.html',
})
export class SharpImageUploaderComponent implements AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);

  // Two-way binding for the image URL
  readonly imageUrl = model<string>('');
  readonly label = input<string>('Practitioner Avatar Image');
  readonly requiredError = input<string>('Avatar image is mandatory. Please provide a Direct Image URL or Upload & Crop a photo.');

  readonly imageChanged = output<string>();

  @ViewChild('cropperCanvas') private readonly cropperCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') private readonly fileInputRef?: ElementRef<HTMLInputElement>;

  // UI Mode: 'url' | 'upload'
  readonly activeTab = signal<'url' | 'upload'>('url');

  // Direct URL Input state
  readonly directUrlInput = signal<string>('');
  readonly urlImageError = signal<boolean>(false);
  readonly isTestingUrl = signal<boolean>(false);

  // Modal & Cropper State
  readonly isModalOpen = signal<boolean>(false);
  readonly isUploading = signal<boolean>(false);
  readonly uploadError = signal<string | null>(null);
  readonly uploadSuccess = signal<boolean>(false);

  // Cropper transform state
  readonly zoom = signal<number>(1);
  readonly panX = signal<number>(0);
  readonly panY = signal<number>(0);

  private activeImage: HTMLImageElement | null = null;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialPanX = 0;
  private initialPanY = 0;

  ngAfterViewInit(): void {
    if (this.imageUrl()) {
      this.directUrlInput.set(this.imageUrl());
    }
  }

  ngOnDestroy(): void {
    this.activeImage = null;
  }

  // --- TAB SWITCHING ---
  setTab(tab: 'url' | 'upload'): void {
    this.activeTab.set(tab);
    this.uploadError.set(null);
  }

  // --- DIRECT URL HANDLERS ---
  onUrlInput(value: string): void {
    this.directUrlInput.set(value.trim());
    this.urlImageError.set(false);
  }

  applyDirectUrl(): void {
    const val = this.directUrlInput().trim();
    if (!val) {
      this.imageUrl.set('');
      this.imageChanged.emit('');
      return;
    }

    this.isTestingUrl.set(true);
    const testImg = new Image();
    testImg.onload = () => {
      this.isTestingUrl.set(false);
      this.urlImageError.set(false);
      this.imageUrl.set(val);
      this.imageChanged.emit(val);
    };
    testImg.onerror = () => {
      this.isTestingUrl.set(false);
      this.urlImageError.set(true);
      // Still set URL if user insists, but highlight error flag
      this.imageUrl.set(val);
      this.imageChanged.emit(val);
    };
    testImg.src = val;
  }

  clearImage(): void {
    this.directUrlInput.set('');
    this.imageUrl.set('');
    this.urlImageError.set(false);
    this.uploadSuccess.set(false);
    this.imageChanged.emit('');
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  // --- FILE PICKER & DRAG/DROP ---
  triggerFileInput(): void {
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.processSelectedFile(file);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.processSelectedFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private processSelectedFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        this.openCropperWithImageSrc(result);
      }
    };
    reader.readAsDataURL(file);
  }

  // --- CROPPER MODAL CONTROLS ---
  openCropperWithCurrent(): void {
    const current = this.imageUrl();
    if (current) {
      this.openCropperWithImageSrc(current);
    }
  }

  private openCropperWithImageSrc(src: string): void {
    this.uploadError.set(null);
    this.zoom.set(1);
    this.panX.set(0);
    this.panY.set(0);
    this.isModalOpen.set(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.activeImage = img;
      // Allow modal DOM to render canvas before drawing
      setTimeout(() => this.redrawCanvas(), 50);
    };
    img.onerror = () => {
      this.uploadError.set('Could not load image into cropper. Remote image may have restricted CORS.');
    };
    img.src = src;
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.activeImage = null;
    this.uploadError.set(null);
  }

  // --- CANVAS INTERACTION & RENDERING ---
  onZoomChange(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.zoom.set(val);
    this.redrawCanvas();
  }

  zoomIn(): void {
    this.zoom.update((z) => Math.min(3, +(z + 0.1).toFixed(2)));
    this.redrawCanvas();
  }

  zoomOut(): void {
    this.zoom.update((z) => Math.max(0.5, +(z - 0.1).toFixed(2)));
    this.redrawCanvas();
  }

  nudge(dx: number, dy: number): void {
    this.panX.update((x) => x + dx);
    this.panY.update((y) => y + dy);
    this.redrawCanvas();
  }

  resetTransform(): void {
    this.zoom.set(1);
    this.panX.set(0);
    this.panY.set(0);
    this.redrawCanvas();
  }

  onCanvasMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialPanX = this.panX();
    this.initialPanY = this.panY();
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;
    this.panX.set(this.initialPanX + dx);
    this.panY.set(this.initialPanY + dy);
    this.redrawCanvas();
  }

  onCanvasMouseUp(): void {
    this.isDragging = false;
  }

  private redrawCanvas(): void {
    const canvas = this.cropperCanvasRef?.nativeElement;
    if (!canvas || !this.activeImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    const img = this.activeImage;
    const z = this.zoom();
    const px = this.panX();
    const py = this.panY();

    // Calculate base fit size (cover square area)
    const aspect = img.naturalWidth / img.naturalHeight;
    let baseW = w;
    let baseH = h;
    if (aspect > 1) {
      baseW = h * aspect;
    } else {
      baseH = w / aspect;
    }

    const drawW = baseW * z;
    const drawH = baseH * z;

    ctx.save();
    ctx.translate(w / 2 + px, h / 2 + py);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Draw Grid Lines (Rule of thirds)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;

    // Vertical third lines
    ctx.beginPath();
    ctx.moveTo(w / 3, 0);
    ctx.lineTo(w / 3, h);
    ctx.moveTo((w * 2) / 3, 0);
    ctx.lineTo((w * 2) / 3, h);

    // Horizontal third lines
    ctx.moveTo(0, h / 3);
    ctx.lineTo(w, h / 3);
    ctx.moveTo(0, (h * 2) / 3);
    ctx.lineTo(w, (h * 2) / 3);
    ctx.stroke();

    // Center crosshair
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 8, h / 2);
    ctx.lineTo(w / 2 + 8, h / 2);
    ctx.moveTo(w / 2, h / 2 - 8);
    ctx.lineTo(w / 2, h / 2 + 8);
    ctx.stroke();

    ctx.restore();
  }

  // --- CROP & UPLOAD TO CLOUDFLARE R2 ---
  cropAndUpload(): void {
    const canvas = this.cropperCanvasRef?.nativeElement;
    if (!canvas || !this.activeImage) return;

    this.isUploading.set(true);
    this.uploadError.set(null);

    try {
      // Export at high-res 500x500 square
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 500;
      exportCanvas.height = 500;
      const exportCtx = exportCanvas.getContext('2d');

      if (!exportCtx) {
        throw new Error('Could not instantiate 2D export canvas');
      }

      const img = this.activeImage;
      const z = this.zoom();
      const px = this.panX() * (500 / canvas.width);
      const py = this.panY() * (500 / canvas.height);

      const aspect = img.naturalWidth / img.naturalHeight;
      let baseW = 500;
      let baseH = 500;
      if (aspect > 1) {
        baseW = 500 * aspect;
      } else {
        baseH = 500 / aspect;
      }

      const drawW = baseW * z;
      const drawH = baseH * z;

      exportCtx.fillStyle = '#ffffff';
      exportCtx.fillRect(0, 0, 500, 500);

      exportCtx.save();
      exportCtx.translate(250 + px, 250 + py);
      exportCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      exportCtx.restore();

      const base64Data = exportCanvas.toDataURL('image/webp', 0.92);

      // Post payload to R2 Upload Endpoint
      this.http
        .post<UploadResponse>('/api/upload', {
          imageBase64: base64Data,
          filename: `avatar-${Date.now()}.webp`,
          mimeType: 'image/webp',
        })
        .subscribe({
          next: (res) => {
            this.isUploading.set(false);
            this.imageUrl.set(res.url);
            this.directUrlInput.set(res.url);
            this.imageChanged.emit(res.url);
            this.uploadSuccess.set(true);
            this.closeModal();
          },
          error: (err) => {
            this.isUploading.set(false);
            const msg = err.error?.error || err.message || 'Upload to R2 storage failed';
            this.uploadError.set(msg);
          },
        });
    } catch (err) {
      this.isUploading.set(false);
      this.uploadError.set((err as Error).message);
    }
  }
}
