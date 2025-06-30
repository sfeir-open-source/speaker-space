import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ImportResult} from '../../type/session/session';
import {EventService} from '../../services/event/event.service';

@Component({
  selector: 'app-base-import',
  imports: [],
  templateUrl: './base-import.component.html',
  styleUrl: './base-import.component.scss'
})
export abstract class BaseImportComponent {
  @Input() eventId!: string;
  @Output() importCompleted = new EventEmitter<ImportResult>();

  selectedFile: File | null = null;
  isImporting: boolean = false;
  importResult: ImportResult | null = null;
  fileError: string | null = null;

  protected readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  constructor(protected eventService: EventService) {}

  abstract importSessions(): void;
  abstract validateData(data: any): void;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!this.isValidFile(file)) return;

      this.selectedFile = file;
      this.resetState();
    }
  }

  protected processFile(processor: (content: string) => void): void {
    if (!this.selectedFile || !this.eventId) return;

    this.isImporting = true;
    this.resetState();

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = e.target?.result as string;

        if (!jsonContent || jsonContent.trim() === '') {
          throw new Error('File is empty');
        }

        JSON.parse(jsonContent);

        processor(jsonContent);
      } catch (error) {
        console.error('JSON parsing error:', error);

        if (error instanceof SyntaxError) {
          this.handleError('Invalid JSON format. Please check your file syntax.');
        } else {
          this.handleError(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };

    reader.onerror = () => this.handleError('Failed to read the file. Please try again.');
    reader.readAsText(this.selectedFile);
  }

  protected handleImportResult(result: ImportResult): void {
    this.importResult = result;
    this.importCompleted.emit(result);
    this.isImporting = false;

    if (result.successCount > 0) {
      this.clearFileSelection();
    }
  }

  protected handleError(message: string): void {
    this.fileError = message;
    this.isImporting = false;
  }

  private isValidFile(file: File): boolean {
    if (!file.name.toLowerCase().endsWith('.json')) {
      this.fileError = 'Please select a valid JSON file';
      this.selectedFile = null;
      return false;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.fileError = 'File size must be less than 10MB';
      this.selectedFile = null;
      return false;
    }

    return true;
  }

  private clearFileSelection(): void {
    this.selectedFile = null;
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      (input as HTMLInputElement).value = '';
    });
  }


  private resetState(): void {
    this.importResult = null;
    this.fileError = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes : string[] = ['Bytes', 'KB', 'MB', 'GB'];
    const i : number = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getResultClass(): string {
    if (!this.importResult) return '';

    const hasErrors : boolean = this.importResult.errors?.length > 0;
    const allSuccess : boolean = this.importResult.successCount === this.importResult.totalCount;

    if (allSuccess && !hasErrors) return 'bg-green-50 border-green-200 border-l-green-500';
    if (this.importResult.successCount > 0) return 'bg-yellow-50 border-yellow-200 border-l-yellow-500';
    return 'bg-red-50 border-red-200 border-l-red-500';
  }

  getResultIcon(): string {
    if (!this.importResult) return 'info';

    const hasErrors : boolean = this.importResult.errors?.length > 0;
    const allSuccess : boolean = this.importResult.successCount === this.importResult.totalCount;

    if (allSuccess && !hasErrors) return 'check_circle';
    if (this.importResult.successCount > 0) return 'warning';
    return 'error';
  }

  getIconClass(): string {
    if (!this.importResult) return 'text-blue-600';

    const hasErrors : boolean = this.importResult.errors?.length > 0;
    const allSuccess : boolean = this.importResult.successCount === this.importResult.totalCount;

    if (allSuccess && !hasErrors) return 'text-green-600';
    if (this.importResult.successCount > 0) return 'text-yellow-600';
    return 'text-red-600';
  }
}
