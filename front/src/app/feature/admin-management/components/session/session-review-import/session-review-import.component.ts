import { Component, Signal, input, output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ImportCallbacks, ImportResult, SessionImportData } from '../../../type/session/session';
import { ButtonComponent } from '../../../../../shared/button/button.component';
import { FileImportService } from '../../../services/sessions/field-import.service';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';

@Component({
  selector: 'app-session-review-import',
  imports: [ButtonComponent],
  templateUrl: './session-review-import.component.html',
  styleUrl: './session-review-import.component.scss',
  providers: [FileImportService]
})
export class SessionReviewImportComponent {
  private readonly eventService = inject(EventService);
  private readonly eventDataService = inject(EventDataService);
  private readonly fileImportService = inject(FileImportService);

  readonly eventId = input.required<string>();
  readonly importCompleted = output<ImportResult>();

  readonly selectedFile: Signal<File | null> = this.fileImportService.selectedFile;
  readonly isImporting: Signal<boolean> = this.fileImportService.isImporting;
  readonly importResult: Signal<ImportResult | null> = this.fileImportService.importResult;
  readonly fileError: Signal<string | null> = this.fileImportService.fileError;

  constructor() {
    this.fileImportService.importCompleted$.pipe(
      takeUntilDestroyed()
    ).subscribe(result => this.importCompleted.emit(result));
  }

  onFileSelected(event: Event): void {
    this.fileImportService.handleFileSelection(event);
  }

  importSessions(): void {
    const callbacks: ImportCallbacks = {
      onValidateData: (data) => this.validateData(data),
      onProcessData: (data) => this.processReviewData(data),
      onImportComplete: () => this.refreshEventData()
    };

    this.fileImportService.processImport(callbacks);
  }

  formatFileSize(bytes: number): string {
    return this.fileImportService.formatFileSize(bytes);
  }

  getResultClass(): string {
    return this.fileImportService.getResultClasses();
  }

  getResultIcon(): string {
    return this.fileImportService.getResultIcon();
  }

  getIconClass(): string {
    return this.fileImportService.getIconClasses();
  }

  private validateData(data: any[]): void {
    if (!Array.isArray(data)) {
      throw new Error('JSON must contain an array of sessions');
    }

    if (data.length === 0) {
      throw new Error('No sessions found in the file');
    }

    const errors: string[] = [];
    data.forEach((session: any, index: number) => {
      if (!session.title || typeof session.title !== 'string') {
        errors.push(`Session ${index + 1}: missing valid title`);
      }
      if (!session.abstract || typeof session.abstract !== 'string') {
        errors.push(`Session ${index + 1}: missing valid abstract`);
      }
      if (!session.id || typeof session.id !== 'string') {
        errors.push(`Session ${index + 1}: missing valid ID`);
      }
    });

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
  }

  private processReviewData(sessionsData: any[]): Observable<ImportResult> {
    const transformedData = this.transformReviewData(sessionsData);
    return this.eventService.importSessions(this.eventId(), transformedData);
  }

  private transformReviewData(reviewData: any[]): SessionImportData[] {
    return reviewData.map(session => ({
      id: session.id,
      title: session.title,
      abstractText: session.abstract,
      deliberationStatus: session.deliberationStatus || '',
      confirmationStatus: session.confirmationStatus || '',
      level: session.level || '',
      references: session.references || '',
      formats: session.formats || [],
      categories: session.categories || [],
      tags: session.tags || [],
      languages: session.languages || [],
      speakers: session.speakers || [],
      reviews: session.review || null,
      eventId: this.eventId()
    }));
  }

  private refreshEventData(): void {
    const currentEventId = this.eventId();
    if (currentEventId) {
      this.eventService.getEventById(currentEventId).pipe(
        takeUntilDestroyed()
      ).subscribe({
        next: (event) => {
          this.eventDataService.loadEvent(event);
        },
        error: (error) => console.warn('Failed to refresh event data:', error)
      });
    }
  }
}
