import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ImportResult, Speaker} from '../../../type/session/session';
import {EventService} from '../../../services/event/event.service';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {
  ScheduleJsonData,
  SessionScheduleImportDataDTO,
} from '../../../type/session/schedule-json-data';

@Component({
  selector: 'app-session-schedule-import',
  imports: [
    ButtonGreyComponent
  ],
  templateUrl: './session-schedule-import.component.html',
  styleUrl: './session-schedule-import.component.scss'
})
export class SessionScheduleImportComponent {
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
        const scheduleData: ScheduleJsonData = JSON.parse(jsonContent);

        this.validateScheduleData(scheduleData);

        const transformedSessions = this.transformScheduleToSessionData(scheduleData);

        this.eventService.importSessionsSchedule(this.eventId, transformedSessions)
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
              this.fileError = 'Failed to import schedule sessions. Please try again.';
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

  private validateScheduleData(data: ScheduleJsonData): void {
    const errors: string[] = [];

    if (!data.sessions || !Array.isArray(data.sessions)) {
      throw new Error('JSON must contain a sessions array.');
    }

    if (data.sessions.length === 0) {
      throw new Error('No sessions found in the schedule.');
    }

    data.sessions.forEach((session, index) => {
      if (!session.id || typeof session.id !== 'string') {
        errors.push(`Session ${index + 1}: missing valid ID.`);
      }
      if (!session.start) {
        errors.push(`Session ${index + 1}: missing start time.`);
      }
      if (!session.end) {
        errors.push(`Session ${index + 1}: missing end time.`);
      }
      if (session.proposal && session.proposal.speakers) {
        session.proposal.speakers.forEach((speaker, speakerIndex) => {
          if (!speaker.id) {
            errors.push(`Session ${index + 1}, Speaker ${speakerIndex + 1}: missing speaker ID.`);
          }
        });
      }
    });

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
  }

  private transformScheduleToSessionData(scheduleData: ScheduleJsonData): SessionScheduleImportDataDTO[] {
    return scheduleData.sessions.map(session => ({
      id: session.id,
      start: new Date(session.start),
      end: new Date(session.end),
      track: session.track || '',
      title: session.title || '',
      languages: session.languages || '',
      proposal: session.proposal ? {
        id: session.proposal.id,
        abstractText: session.proposal.abstractText,
        level: session.proposal.level,
        formats: session.proposal.formats || [],
        categories: session.proposal.categories || [],
        speakers: session.proposal.speakers ? session.proposal.speakers.map(speaker => ({
          id: speaker.id,
          name: speaker.name,
          bio: speaker.bio,
          company: speaker.company,
          picture: speaker.picture,
          socialLinks: speaker.socialLinks || []
        })) : []
      } : undefined,
      eventId: this.eventId
    }));
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
