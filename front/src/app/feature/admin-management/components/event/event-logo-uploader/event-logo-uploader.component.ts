import { Component, computed, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { ImageUploadService } from '../../../services/event/image-upload.service';
import { ButtonComponent } from '../../../../../shared/button/button.component';

@Component({
  selector: 'app-event-logo-uploader',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './event-logo-uploader.component.html',
  styleUrl: './event-logo-uploader.component.scss'
})
export class EventLogoUploaderComponent {
  readonly initialImageUrl = input<string | null>(null);
  readonly disabled = input<boolean>(false);

  readonly imageSelected = output<string>();
  readonly imageRemoved = output<void>();
  readonly uploadError = output<string>();

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly selectedImageUrl = signal<string | null>(null);
  readonly isProcessing = signal<boolean>(false);
  readonly isDragOver = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly canUpload = computed(() => !this.isProcessing() && !this.disabled());
  readonly hasImage = computed(() => !!this.selectedImageUrl());
  readonly showUploadArea = computed(() => !this.hasImage() && !this.isProcessing());

  constructor(private readonly imageUploadService: ImageUploadService) {

    effect(() => {
      const initial = this.initialImageUrl();

      if (initial) {
        this.selectedImageUrl.set(initial);
      }
    });
  }

  triggerFileInput(): void {
    if (this.canUpload()) {
      this.fileInput()?.nativeElement.click();
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      await this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.canUpload()) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragOver.set(false);

    if (!this.canUpload()) {
      return;
    }

    const file = event.dataTransfer?.files[0];
    if (file) {
      await this.handleFile(file);
    }
  }

  private async handleFile(file: File): Promise<void> {
    this.errorMessage.set(null);
    this.isProcessing.set(true);

    try {
      const result = await this.imageUploadService.processImage(file);

      this.cleanupBlobUrl();

      this.selectedImageUrl.set(result.base64);
      this.imageSelected.emit(result.base64);

    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Erreur lors du traitement de l\'image';

      this.errorMessage.set(message);
      this.uploadError.emit(message);
      console.error('Image upload error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  removeImage(event: Event): void {
    event.stopPropagation();

    this.cleanupBlobUrl();
    this.selectedImageUrl.set(null);
    this.errorMessage.set(null);

    const input = this.fileInput()?.nativeElement;
    if (input) {
      input.value = '';
    }

    this.imageRemoved.emit();
  }

  private cleanupBlobUrl(): void {
    const url = this.selectedImageUrl();
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
