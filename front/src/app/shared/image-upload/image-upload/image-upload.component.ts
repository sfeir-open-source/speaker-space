import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ImageUploadConfig, ImageUploadResult } from '../image-upload.type';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss'
})
export class ImageUploadComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() config!: ImageUploadConfig;
  @Input() initialImageUrl: string | null = null;
  @Input() allowRemove: boolean = true;
  @Input() formControl: FormControl | null = null;
  @Input() isExternalSaving: boolean = false;
  @Input() isExternalDeleting: boolean = false;

  @Output() imageSelected = new EventEmitter<ImageUploadResult>();
  @Output() imageRemoved = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  currentImageUrl: string | null = null;
  selectedFile: File | null = null;
  isUploading: boolean = false;
  isDeleting: boolean = false;
  isSaving: boolean = false;
  uploadError$: string | null = null;
  isDragOver: boolean = false;

  ngOnInit(): void {
    if (this.initialImageUrl) {
      this.currentImageUrl = this.initialImageUrl;
    }
  }

  ngOnDestroy(): void {
    this.cleanupBlobUrl();
  }

  get acceptString(): string {
    return this.config.acceptedFormats.join(',');
  }

  get displayImageUrl(): string | null {
    return this.currentImageUrl || this.initialImageUrl;
  }

  getUploadAreaClasses(): string {
    const baseClasses = `relative border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors duration-200 flex items-center justify-center overflow-hidden`;
    const sizeClasses: string = this.getSizeClasses();
    const stateClasses = this.isDragOver ? 'border-blue-500 bg-blue-50' : '';

    return `${baseClasses} ${sizeClasses} ${stateClasses}`.trim();
  }

  getImageClasses(): string {
    const baseClasses = 'object-cover';
    const shapeClasses = this.config.shape === 'circle' ? 'rounded-full' : 'rounded-lg';
    const sizeClasses = 'w-full h-full';

    return `${baseClasses} ${shapeClasses} ${sizeClasses}`;
  }

  private getSizeClasses(): string {
    const width: string = this.config.width || 'w-32';
    const height: string = this.config.height || 'h-32';
    return `${width} ${height}`;
  }

  triggerFileInput(): void {
    if (!this.isUploading && this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private async handleFile(file: File): Promise<void> {
    this.uploadError$ = null;

    if (!this.config.acceptedFormats.includes(file.type)) {
      const error = `Unsupported file format. Use ${this.getFormatList()}.`;
      this.uploadError$ = error;
      this.uploadError.emit(error);
      return;
    }

    if (file.size > this.config.maxFileSize) {
      const error = `File too large. Maximum size: ${this.formatFileSize(this.config.maxFileSize)}.`;
      this.uploadError$ = error;
      this.uploadError.emit(error);
      return;
    }

    try {
      this.isUploading = true;
      this.cleanupBlobUrl();

      const processedFile = await this.compressImageIfNeeded(file);
      const base64: string = await this.convertToBase64(processedFile);
      const blobUrl: string = URL.createObjectURL(processedFile);

      this.selectedFile = processedFile;
      this.currentImageUrl = blobUrl;

      if (this.formControl) {
        this.formControl.setValue(base64);
        this.formControl.markAsTouched();
      }

      this.imageSelected.emit({
        file: processedFile,
        base64,
        url: blobUrl
      });

    } catch (error) {
      console.error('Error processing image:', error);
      const errorMsg = 'Error processing image. Please try again.';
      this.uploadError$ = errorMsg;
      this.uploadError.emit(errorMsg);
    } finally {
      this.isUploading = false;
    }
  }

  removeImage(event: Event): void {
    event.stopPropagation();

    // ✅ CORRECTION: Indiquer que la suppression commence
    this.isDeleting = true;

    this.cleanupBlobUrl();
    this.currentImageUrl = null;
    this.selectedFile = null;
    this.uploadError$ = null;

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    if (this.formControl) {
      this.formControl.setValue('');
      this.formControl.markAsTouched();
    }

    this.imageRemoved.emit();
  }

  stopDeleting(): void {
    this.isDeleting = false;
  }

  stopSaving(): void {
    this.isSaving = false;
  }

  onImageError(event: Event): void {
    console.error('Error loading image:', event);
    const error = 'Error loading image preview.';
    this.uploadError$ = error;
    this.uploadError.emit(error);
  }

  get isProcessing(): boolean {
    return this.isUploading || this.isDeleting || this.isSaving ||
      this.isExternalSaving || this.isExternalDeleting;
  }

  private async compressImageIfNeeded(file: File): Promise<File> {
    if (file.size <= this.config.maxFileSize) {
      return file;
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const maxSize = 500;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = height * (maxSize / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = width * (maxSize / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private cleanupBlobUrl(): void {
    if (this.currentImageUrl && this.currentImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentImageUrl);
    }
  }

  protected getFormatDescription(): string {
    const formats: string = this.config.acceptedFormats
      .map(format => format.replace('image/', '').toUpperCase())
      .join(', ');

    const sizeText: string = this.config.recommendedSize ? ` with optimal resolution of ${this.config.recommendedSize}` : '';
    return `${formats} formats supported${sizeText}.`;
  }

  private getFormatList(): string {
    return this.config.acceptedFormats
      .map(format => format.replace('image/', '').toUpperCase())
      .join(', ');
  }

  protected formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes: string[] = ['Bytes', 'KB', 'MB'];
    const i: number = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  protected getOptimizationLinkText(): string {
    if (this.config.optimizationLink?.includes('squoosh')) return 'squoosh.app';
    if (this.config.optimizationLink?.includes('tinypng')) return 'tinypng.com';
    return 'optimization tool';
  }
}
