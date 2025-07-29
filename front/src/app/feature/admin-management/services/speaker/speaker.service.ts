import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Speaker} from '../../type/session/session';
import {environment} from '../../../../../environments/environment.development';
import {SpeakerWithSessionsDTO} from '../../type/speaker/speaker-with-sessions';
import {map} from 'rxjs/operators';
import {SpeakerCreateRequest, SpeakerImportData} from '../../type/speaker/speaker-create';
import {convertToDate} from '../../utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class SpeakerService {

  constructor(
    private http: HttpClient,
  ) {}

  getSpeakerById(eventId: string, speakerId: string): Observable<Speaker> {
    return this.http.get<Speaker>(
      `${environment.apiUrl}/session/event/${eventId}/speaker/${speakerId}`,
      { withCredentials: true }
    );
  }

  getSpeakersWithSessionsByEventId(eventId: string): Observable<SpeakerWithSessionsDTO[]> {
    return this.http.get<SpeakerWithSessionsDTO[]>(`${environment.apiUrl}/session/event/${eventId}/speakers-with-sessions`);
  }

  getSpeakersByEventId(eventId: string): Observable<Speaker[]> {
    return this.http.get<Speaker[]>(
      `${environment.apiUrl}/session/event/${eventId}/speakers`,
      { withCredentials: true }
    );
  }

  createSpeaker(eventId: string, speakerData: SpeakerCreateRequest): Observable<SpeakerImportData> {
    return this.http.post<SpeakerImportData>(
      `${environment.apiUrl}/speaker/event/${eventId}/new-speaker`,
      speakerData,
      { withCredentials: true }
    ).pipe(
      map(speakerData => this.convertSpeakerDates(speakerData))
    );
  }

  private convertSpeakerDates(speakerData: SpeakerImportData): SpeakerImportData {
    return {
      ...speakerData,
      createdAt: speakerData.createdAt ? convertToDate(speakerData.createdAt)?.toISOString() : undefined,
      updatedAt: speakerData.updatedAt ? convertToDate(speakerData.updatedAt)?.toISOString() : undefined
    };
  }
}
