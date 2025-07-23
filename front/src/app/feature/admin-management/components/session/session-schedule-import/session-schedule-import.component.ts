import {Component} from '@angular/core';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {
  ScheduleJsonData, ScheduleSessionData,
  SessionScheduleImportDataDTO,
} from '../../../type/session/schedule-json-data';
import {BaseImportComponent} from '../../base-import/base-import.component';
import {ImportResult} from '../../../type/session/session';
import {EventDTO} from '../../../type/event/eventDTO';
import {EventService} from '../../../services/event/event.service';
import {EventDataService} from '../../../services/event/event-data.service';

@Component({
  selector: 'app-session-schedule-import',
  imports: [
    ButtonGreyComponent
  ],
  templateUrl: './session-schedule-import.component.html',
  styleUrl: './session-schedule-import.component.scss'
})
export class SessionScheduleImportComponent extends BaseImportComponent {

  constructor(
    eventService: EventService,
    private eventDataService: EventDataService
  ) {
    super(eventService);
  }

  importSessions(): void {
    this.processFile((jsonContent: string) => {
      const scheduleData: ScheduleJsonData = JSON.parse(jsonContent);
      this.validateData(scheduleData);

      const transformedSessions: SessionScheduleImportDataDTO[] = this.transformScheduleToSessionData(scheduleData);

      this.eventService.importSessionsSchedule(this.eventId, transformedSessions)
        .subscribe({
          next: (result: ImportResult) => {
            this.handleImportResult(result);
            this.refreshEventData();
          },
          error: () => this.handleError('Failed to import schedule sessions. Please try again.')
        });
    });
  }

  validateData(data: ScheduleJsonData): void {
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
        eventId: this.eventId
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
    if (this.eventId) {
      this.eventService.getEventById(this.eventId).subscribe({
        next: (event: EventDTO) => {
          this.eventDataService.loadEvent(event);
        },
        error: (error) => console.warn('Failed to refresh event data:', error)
      });
    }
  }
}
