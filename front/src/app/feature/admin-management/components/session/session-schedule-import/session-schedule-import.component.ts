import {Component} from '@angular/core';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {
  ScheduleJsonData, ScheduleSessionData,
  SessionScheduleImportDataDTO,
} from '../../../type/session/schedule-json-data';
import {BaseImportComponent} from '../../base-import/base-import.component';
import {ImportResult} from '../../../type/session/session';

@Component({
  selector: 'app-session-schedule-import',
  imports: [
    ButtonGreyComponent
  ],
  templateUrl: './session-schedule-import.component.html',
  styleUrl: './session-schedule-import.component.scss'
})
export class SessionScheduleImportComponent extends BaseImportComponent {

  importSessions(): void {
    this.processFile((jsonContent : string) => {
      const scheduleData: ScheduleJsonData = JSON.parse(jsonContent);
      this.validateData(scheduleData);

      const transformedSessions : SessionScheduleImportDataDTO[] = this.transformScheduleToSessionData(scheduleData);

      this.eventService.importSessionsSchedule(this.eventId, transformedSessions)
        .subscribe({
          next: (result : ImportResult) => this.handleImportResult(result),
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
    data.sessions.forEach((session : ScheduleSessionData , index : number) => {
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
    }));
  }
}
