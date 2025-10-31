import { Component, Signal, input, output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ImportCallbacks, ImportResult } from '../../../type/session/session';
import { FileImportService } from '../../../services/sessions/field-import.service';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import {
  ScheduleJsonData,
  ScheduleSessionData,
  SessionScheduleImportDataDTO
} from '../../../type/session/schedule-json-data';
import { EventDTO } from '../../../type/event/eventDTO';
import { ButtonComponent } from '../../../../../shared/button/button.component';

@Component({
  selector: 'app-session-schedule-import',
  templateUrl: './session-schedule-import.component.html',
  standalone: true,
  imports: [ButtonComponent],
  providers: [FileImportService]
})
export class SessionScheduleImportComponent {
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
      onProcessData: (data) => this.processScheduleData(data),
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

  private validateData(data: ScheduleJsonData): void {
    if (!data.sessions || !Array.isArray(data.sessions)) {
      throw new Error('JSON must contain a sessions array.');
    }

    if (data.sessions.length === 0) {
      throw new Error('No sessions found in the schedule.');
    }

    const errors: string[] = [];
    data.sessions.forEach((session: ScheduleSessionData, index: number) => {
      if (!session.id || typeof session.id !== 'string') {
        errors.push(`Session ${index + 1}: missing valid ID.`);
      }
      if (!session.start) {
        errors.push(`Session ${index + 1}: missing start time.`);
      }
      if (!session.end) {
        errors.push(`Session ${index + 1}: missing end time.`);
      }
    });

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
  }

  private processScheduleData(scheduleData: ScheduleJsonData): Observable<ImportResult> {
    const transformedSessions = this.transformScheduleToSessionData(scheduleData);
    return this.eventService.importSessionsSchedule(this.eventId(), transformedSessions);
  }

  private transformScheduleToSessionData(scheduleData: ScheduleJsonData): SessionScheduleImportDataDTO[] {
    return scheduleData.sessions.map(session => {
      const startDate = this.parseUtcDate(session.start);
      const endDate = this.parseUtcDate(session.end);

      console.log(`Session ${session.id}: JSON start=${session.start}, Preserved start=${startDate?.toISOString()}`);

      return {
        id: session.id,
        start: startDate!,
        end: endDate!,
        track: session.track || '',
        title: session.title || '',
        languages: session.languages || '',
        proposal: session.proposal ? {
          id: session.proposal.id,
          abstractText: session.proposal.abstractText,
          level: session.proposal.level,
          formats: session.proposal.formats || [],
          categories: session.proposal.categories || [],
          speakers: session.proposal.speakers?.map(speaker => ({
            id: speaker.id,
            name: speaker.name,
            bio: speaker.bio,
            company: speaker.company,
            picture: speaker.picture,
            socialLinks: speaker.socialLinks || []
          })) || []
        } : undefined,
        eventId: this.eventId()
      };
    });
  }

  private parseUtcDate(dateValue: any): Date | null {
    if (!dateValue) return null;

    try {
      if (typeof dateValue === 'string') {
        if (dateValue.endsWith('Z')) {
          return new Date(dateValue);
        }

        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      }

      if (dateValue instanceof Date) {
        return dateValue;
      }

      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;

    } catch (error) {
      console.warn('Error parsing date:', dateValue, error);
      return null;
    }
  }

  private refreshEventData(): void {
    const currentEventId = this.eventId();
    if (currentEventId) {
      this.eventService.getEventById(currentEventId).pipe(
        takeUntilDestroyed()
      ).subscribe({
        next: (event: EventDTO) => {
          this.eventDataService.loadEvent(event);
        },
        error: (error) => console.warn('Failed to refresh event data:', error)
      });
    }
  }
}
