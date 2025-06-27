import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ImportResult, SessionImportData} from '../../../type/session/session';
import {EventService} from '../../../services/event/event.service';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';

@Component({
  selector: 'app-session-review-import',
  imports: [
    ButtonGreyComponent
  ],
  templateUrl: './session-review-import.component.html',
  styleUrl: './session-review-import.component.scss'
})
export class SessionReviewImportComponent {
  @Input() eventId!: string;
  @Output() importCompleted = new EventEmitter<ImportResult>();

  selectedFile: File | null = null;
  isImporting: boolean = false;
  importResult: ImportResult | null = null;
  fileError: string | null = null;

  constructor(private eventService: EventService) {}

  importSessions(): void {
    if (!this.selectedFile || !this.eventId) {
      return;
    }

    this.isImporting = true;
    this.resetState();

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = e.target?.result as string;
        const sessionsData: SessionImportData[] = JSON.parse(jsonContent);

        this.validateSessionsData(sessionsData);

        this.eventService.importSessions(this.eventId, sessionsData)
          .subscribe({
            next: (result: ImportResult) => {
              this.importResult = result;
              this.importCompleted.emit(result);
              this.isImporting = false;

              if (result.successCount > 0) {
                this.selectedFile = null;
                const fileInput = document.getElementById('sessionFile') as HTMLInputElement;
                if (fileInput) {
                  fileInput.value = '';
                }
              }
            },
            error: (error) => {
              this.fileError = 'Failed to import sessions. Please try again.';
              this.isImporting = false;
              console.error('Import error:', error);
            }
          });

      } catch (error) {
        this.fileError = 'Invalid JSON format. Please check your file.';
        this.isImporting = false;
        console.error('JSON parsing error:', error);
      }
    };

    reader.onerror = () => {
      this.fileError = 'Failed to read the file. Please try again.';
      this.isImporting = false;
    };

    reader.readAsText(this.selectedFile);
  }

  private validateSessionsData(data: any): void {
    if (!Array.isArray(data)) {
      throw new Error('JSON must contain an array of sessions');
    }

    if (data.length === 0) {
      throw new Error('No sessions found in the file');
    }

    data.forEach((session: any, index: number) => {
      if (!session.title || typeof session.title !== 'string') {
        throw new Error(`Session at index ${index} is missing a valid title`);
      }

      if (!session.abstract || typeof session.abstract !== 'string') {
        throw new Error(`Session at index ${index} is missing a valid abstract`);
      }
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

    const hasErrors : boolean = this.importResult.errors && this.importResult.errors.length > 0;
    const allSuccess : boolean = this.importResult.successCount === this.importResult.totalCount;

    if (allSuccess && !hasErrors) {
      return 'bg-green-50 border-green-200 border-l-green-500';
    } else if (this.importResult.successCount > 0) {
      return 'bg-yellow-50 border-yellow-200 border-l-yellow-500';
    } else {
      return 'bg-red-50 border-red-200 border-l-red-500';
    }
  }

  getResultIcon(): string {
    if (!this.importResult) return 'info';

    const hasErrors : boolean = this.importResult.errors && this.importResult.errors.length > 0;
    const allSuccess : boolean = this.importResult.successCount === this.importResult.totalCount;

    if (allSuccess && !hasErrors) {
      return 'check_circle';
    } else if (this.importResult.successCount > 0) {
      return 'warning';
    } else {
      return 'error';
    }
  }

  getIconClass(): string {
    if (!this.importResult) return 'text-blue-600';

    const hasErrors : boolean = this.importResult.errors && this.importResult.errors.length > 0;
    const allSuccess : boolean = this.importResult.successCount === this.importResult.totalCount;

    if (allSuccess && !hasErrors) {
      return 'text-green-600';
    } else if (this.importResult.successCount > 0) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.name.toLowerCase().endsWith('.json')) {
        this.fileError = 'Please select a valid JSON file';
        this.selectedFile = null;
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        this.fileError = 'File size must be less than 10MB';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      this.fileError = null;
      this.importResult = null;
    }
  }
}
