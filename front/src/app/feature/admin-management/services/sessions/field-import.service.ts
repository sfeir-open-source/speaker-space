import { Injectable, signal, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { ImportCallbacks, ImportResult } from '../../type/session/session';

@Injectable()
export class FileImportService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  private readonly _selectedFile = signal<File | null>(null);
  private readonly _isImporting = signal<boolean>(false);
  private readonly _importResult = signal<ImportResult | null>(null);
  private readonly _fileError = signal<string | null>(null);

  readonly selectedFile = this._selectedFile.asReadonly();
  readonly isImporting = this._isImporting.asReadonly();
  readonly importResult = this._importResult.asReadonly();
  readonly fileError = this._fileError.asReadonly();

  private readonly importCompletedSubject = new Subject<ImportResult>();
  readonly importCompleted$ = this.importCompletedSubject.asObservable().pipe(
    takeUntilDestroyed(this.destroyRef)
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.importCompletedSubject.complete();
      this.resetState();
    });
  }

  handleFileSelection(event: Event): boolean {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      this.resetFileState();
      return false;
    }

    const file = input.files[0];

    if (!this.validateFile(file)) {
      return false;
    }

    this._selectedFile.set(file);
    this.resetImportState();
    return true;
  }

  processImport(callbacks: ImportCallbacks): void {
    const file = this._selectedFile();

    if (!file) {
      this.setError('No file selected');
      return;
    }

    this._isImporting.set(true);
    this.resetImportState();

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonContent = e.target?.result as string;

        if (!jsonContent?.trim()) {
          throw new Error('File is empty');
        }

        const parsedData = JSON.parse(jsonContent);

        callbacks.onValidateData(parsedData);

        callbacks.onProcessData(parsedData).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: (result) => this.handleImportSuccess(result, callbacks.onImportComplete),
          error: (error) => this.handleImportError(error)
        });

      } catch (error) {
        this.handleParsingError(error);
      }
    };

    reader.onerror = () => this.setError('Failed to read the file. Please try again.');
    reader.readAsText(file);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'] as const;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  getResultClasses(): string {
    const result = this._importResult();
    if (!result) return '';

    const hasErrors = (result.errors?.length ?? 0) > 0;
    const allSuccess = result.successCount === result.totalCount;

    if (allSuccess && !hasErrors) {
      return 'bg-green-50 border-green-200 border-l-green-500';
    }

    if (result.successCount > 0) {
      return 'bg-yellow-50 border-yellow-200 border-l-yellow-500';
    }

    return 'bg-red-50 border-red-200 border-l-red-500';
  }

  getResultIcon(): string {
    const result = this._importResult();
    if (!result) return 'info';

    const hasErrors = (result.errors?.length ?? 0) > 0;
    const allSuccess = result.successCount === result.totalCount;

    if (allSuccess && !hasErrors) return 'check_circle';
    if (result.successCount > 0) return 'warning';
    return 'error';
  }

  getIconClasses(): string {
    const result = this._importResult();
    if (!result) return 'text-blue-600';

    const hasErrors = (result.errors?.length ?? 0) > 0;
    const allSuccess = result.successCount === result.totalCount;

    if (allSuccess && !hasErrors) return 'text-green-600';
    if (result.successCount > 0) return 'text-yellow-600';
    return 'text-red-600';
  }

  resetState(): void {
    this._selectedFile.set(null);
    this._isImporting.set(false);
    this._importResult.set(null);
    this._fileError.set(null);
  }

  private validateFile(file: File): boolean {
    if (!file.name.toLowerCase().endsWith('.json')) {
      this.setError('Please select a valid JSON file');
      return false;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.setError('File size must be less than 10MB');
      return false;
    }

    return true;
  }

  private handleImportSuccess(result: ImportResult, onComplete?: (result: ImportResult) => void): void {
    this._importResult.set(result);
    this._isImporting.set(false);

    this.importCompletedSubject.next(result);

    onComplete?.(result);

    if (result.successCount > 0) {
      this.clearFileSelection();
    }
  }

  private handleImportError(error: any): void {
    console.error('Import error:', error);
    this.setError('Failed to import sessions. Please try again.');
  }

  private handleParsingError(error: unknown): void {
    console.error('JSON parsing error:', error);

    if (error instanceof SyntaxError) {
      this.setError('Invalid JSON format. Please check your file syntax.');
    } else {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.setError(`Error processing file: ${message}`);
    }
  }

  private setError(message: string): void {
    this._fileError.set(message);
    this._isImporting.set(false);
  }

  private resetFileState(): void {
    this._selectedFile.set(null);
    this._fileError.set(null);
  }

  private resetImportState(): void {
    this._importResult.set(null);
    this._fileError.set(null);
  }

  private clearFileSelection(): void {
    this._selectedFile.set(null);
  }
}
