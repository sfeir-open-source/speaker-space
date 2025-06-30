import {Component} from '@angular/core';
import {SessionImportData} from '../../../type/session/session';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {BaseImportComponent} from '../../base-import/base-import.component';

@Component({
  selector: 'app-session-review-import',
  imports: [
    ButtonGreyComponent
  ],
  templateUrl: './session-review-import.component.html',
  styleUrl: './session-review-import.component.scss'
})
export class SessionReviewImportComponent extends BaseImportComponent {

  importSessions(): void {
    this.processFile((jsonContent : string) => {
      const sessionsData: any[] = JSON.parse(jsonContent);
      this.validateData(sessionsData);

      const transformedData: SessionImportData[] = this.transformReviewData(sessionsData);

      this.eventService.importSessions(this.eventId, transformedData)
        .subscribe({
          next: (result) => this.handleImportResult(result),
          error: (error) => {
            console.error('Import error:', error);
            this.handleError('Failed to import sessions. Please try again.');
          }
        });
    });
  }

  validateData(data: any[]): void {
    if (!Array.isArray(data)) {
      throw new Error('JSON must contain an array of sessions');
    }

    if (data.length === 0) {
      throw new Error('No sessions found in the file');
    }

    data.forEach((session : any, index : number) => {
      if (!session.title || typeof session.title !== 'string') {
        throw new Error(`Session at index ${index} is missing a valid title`);
      }
      if (!session.abstract || typeof session.abstract !== 'string') {
        throw new Error(`Session at index ${index} is missing a valid abstract`);
      }
      if (!session.id || typeof session.id !== 'string') {
        throw new Error(`Session at index ${index} is missing a valid id`);
      }
    });
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
      eventId: this.eventId
    }));
  }
}
