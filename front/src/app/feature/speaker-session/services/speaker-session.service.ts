import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {SessionImportData} from '../../admin-management/type/session/session';
import {environment} from '../../../../environments/environment.development';
import {map} from 'rxjs/operators';
import {convertToDate} from '../../admin-management/utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class SpeakerSessionService {

  constructor(private http: HttpClient) {}

  getMySessions(eventId: string): Observable<SessionImportData[]> {
    return this.http.get<SessionImportData[]>(
      `${environment.apiUrl}/speaker-sessions/event/${eventId}`,
      { withCredentials: true }
    ).pipe(
      map(sessions => sessions.map(session => this.convertSessionDates(session)))
    );
  }

  getMySessionById(eventId: string, sessionId: string): Observable<SessionImportData> {
    return this.http.get<SessionImportData>(
      `${environment.apiUrl}/speaker-sessions/event/${eventId}/session/${sessionId}`,
      { withCredentials: true }
    ).pipe(
      map(session => this.convertSessionDates(session))
    );
  }

  private convertSessionDates(sessionData: any): SessionImportData {
    return {
      ...sessionData,
      start: convertToDate(sessionData.start),
      end: convertToDate(sessionData.end),
      createdAt: sessionData.createdAt ? convertToDate(sessionData.createdAt)?.toISOString() : undefined,
      updatedAt: sessionData.updatedAt ? convertToDate(sessionData.updatedAt)?.toISOString() : undefined
    };
  }
}
