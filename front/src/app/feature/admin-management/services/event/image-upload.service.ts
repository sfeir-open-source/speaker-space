import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import {ImageUploadConfig, ImageUploadResult} from '../../type/event/image-upload';

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private readonly DEFAULT_CONFIG: ImageUploadConfig = {
    maxFileSize: 300 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    maxDimension: 500,
    compressionQuality: 0.8
  };

  validateFile(file: File, config = this.DEFAULT_CONFIG): { valid: boolean; error?: string } {
    if (!config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Format non supporté. Utilisez JPEG, PNG, WEBP ou AVIF.'
      };
    }

    if (file.size > config.maxFileSize) {
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille max: ${config.maxFileSize / 1024}KB.`
      };
    }

    return { valid: true };
  }

  compressImage(file: File, config = this.DEFAULT_CONFIG): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const img = new Image();

      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          config.maxDimension
        );

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          config.compressionQuality
        );

        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Image loading failed'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  convertToBase64(file: File): Observable<string> {
    return from(
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })
    );
  }

  async processImage(file: File, config = this.DEFAULT_CONFIG): Promise<ImageUploadResult> {
    const validation = this.validateFile(file, config);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const compressedFile = await this.compressImage(file, config);
    const base64 = await this.convertToBase64(compressedFile).toPromise();

    if (!base64) {
      throw new Error('Base64 conversion failed');
    }

    return {
      base64,
      file: compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size
    };
  }

  private calculateDimensions(width: number, height: number, maxSize: number): { width: number; height: number } {
    if (width <= maxSize && height <= maxSize) {
      return { width, height };
    }

    const ratio = width / height;

    if (width > height) {
      return { width: maxSize, height: Math.round(maxSize / ratio) };
    } else {
      return { width: Math.round(maxSize * ratio), height: maxSize };
    }
  }
}
