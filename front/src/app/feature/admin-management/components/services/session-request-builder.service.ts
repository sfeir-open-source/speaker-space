import { Injectable, inject } from '@angular/core';
import { SessionDateCalculatorService } from './session-date-calculator.service';
import {Category, Format, Speaker} from '../../type/session/session';
import {SessionCreateRequest} from '../../type/session/session-create';

export interface SessionFormValue {
  title: string;
  abstractText?: string;
  references?: string;
  level?: string;
  track?: string;
  startDate: string;
  startTime: string;
}

@Injectable()
export class SessionRequestBuilderService {
  private readonly dateCalculator = inject(SessionDateCalculatorService);

  buildCreateRequest(
    formValue: SessionFormValue,
    eventId: string,
    selectedDuration: number,
    selectedLanguages: string[],
    selectedFormats: Format[],
    selectedCategories: Category[],
    selectedSpeakers: Speaker[]
  ): SessionCreateRequest {
    const { startDateTime, endDateTime } = this.dateCalculator.calculateSessionTimes(
      formValue.startDate,
      formValue.startTime,
      selectedDuration
    );

    return {
      title: formValue.title.trim(),
      abstractText: formValue.abstractText?.trim() || '',
      references: formValue.references?.trim() || '',
      level: formValue.level || '',
      track: formValue.track?.trim() || '',
      languages: [...selectedLanguages],
      formats: [...selectedFormats],
      categories: [...selectedCategories],
      speakers: [...selectedSpeakers],
      eventId,
      deliberationStatus: 'ACCEPTED',
      confirmationStatus: 'CONFIRMED',
      start: startDateTime,
      end: endDateTime
    };
  }

  getSelectedFormats(availableFormats: Format[], selectedIds: string[]): Format[] {
    return availableFormats.filter(format => selectedIds.includes(format.id));
  }

  getSelectedCategories(availableCategories: Category[], selectedIds: string[]): Category[] {
    return availableCategories.filter(category => selectedIds.includes(category.id));
  }
}
