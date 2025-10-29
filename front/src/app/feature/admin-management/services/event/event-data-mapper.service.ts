import { Injectable } from '@angular/core';
import {EventDTO} from '../../type/event/eventDTO';
import {environment} from '../../../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class EventDataMapperService {
  extractModifiedFields(
    formValue: Record<string, unknown>,
    initialData: Partial<EventDTO> | null
  ): Partial<EventDTO> {
    const data: Partial<EventDTO> = {
      idEvent: initialData?.idEvent
    };

    const fieldMappings: Array<{
      formKey: string;
      dtoKey: keyof EventDTO;
      initialValue: unknown;
    }> = [
      {
        formKey: 'eventName',
        dtoKey: 'eventName',
        initialValue: initialData?.eventName
      },
      {
        formKey: 'urlConferenceHall',
        dtoKey: 'conferenceHallUrl',
        initialValue: initialData?.conferenceHallUrl
      },
      {
        formKey: 'type',
        dtoKey: 'type',
        initialValue: initialData?.type
      },
      {
        formKey: 'timeZone',
        dtoKey: 'timeZone',
        initialValue: initialData?.timeZone
      }
    ];

    fieldMappings.forEach(({ formKey, dtoKey, initialValue }) => {
      if (formValue[formKey] !== undefined && formValue[formKey] !== initialValue) {
        (data as Record<string, unknown>)[dtoKey] = formValue[formKey];
      }
    });

    const currentIsPrivate = formValue['visibility'] === 'private';
    if (currentIsPrivate !== initialData?.privateEvent) {
      data.privateEvent = currentIsPrivate;
    }

    return data;
  }

  prepareInitialFormData(data: Partial<EventDTO>): Record<string, unknown> {
    const fullUrl = data.url
      ? data.url.startsWith('http')
        ? data.url
        : `${environment.baseUrl}/event/${data.url}`
      : '';

    const visibility = data.privateEvent ? 'private' : 'public';

    return {
      eventName: data.eventName || '',
      eventURL: fullUrl,
      urlConferenceHall: data.conferenceHallUrl || '',
      timeZone: data.timeZone || 'Europe/Paris',
      visibility,
      type: data.type
    };
  }

  formToEventDTO(formValue: Record<string, unknown>, teamId: string | null): EventDTO {
    return {
      eventName: formValue['name'] as string,
      url: formValue['url'] as string,
      conferenceHallUrl: formValue['urlConferenceHall'] as string,
      timeZone: formValue['timeZone'] as string,
      teamId: (formValue['teamId'] as string) || teamId,
      privateEvent: true,
      type: formValue['type'] as string
    };
  }
}
