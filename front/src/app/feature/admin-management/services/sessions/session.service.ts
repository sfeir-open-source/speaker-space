import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {SessionImportData} from '../../type/session/session';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../../environments/environment.development';
import {map} from 'rxjs/operators';
import {convertToDate} from '../../utils/date.utils';
import {SessionScheduleUpdate} from '../../type/session/schedule-json-data';
import {SessionCreateRequest} from '../../type/session/session-create';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private http: HttpClient) {}

  getSessionById(eventId: string, sessionId: string): Observable<SessionImportData> {
    return this.http.get<any>(
      `${environment.apiUrl}/session/event/${eventId}/session/${sessionId}`,
      { withCredentials: true }
    ).pipe(
      map(sessionData => this.convertSessionDates(sessionData)),
      map(sessionData => this.normalizeSessionData(sessionData))
  );
  }

  getSessionsByEventId(eventId: string): Observable<SessionImportData[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/session/event/${eventId}`,
      { withCredentials: true }
    ).pipe(
      map(sessions => sessions.map(session => this.convertSessionDates(session))),
      map(sessions => sessions.map(session => this.normalizeSessionData(session)))
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

  private normalizeSessionData(sessionData: any): SessionImportData {
    return {
      ...sessionData,
      abstractText: sessionData.abstractText || sessionData.abstract || undefined
    };
  }

  updateSessionSchedule(eventId: string, sessionId: string, scheduleUpdate: SessionScheduleUpdate): Observable<SessionImportData> {
    return this.http.put<any>(
      `${environment.apiUrl}/session/event/${eventId}/session/${sessionId}/schedule`,
      scheduleUpdate,
      { withCredentials: true }
    ).pipe(
      map(sessionData => this.convertSessionDates(sessionData))
    );
  }

  getAvailableTracksForEvent(eventId: string): Observable<string[]> {
    return this.http.get<string[]>(
      `${environment.apiUrl}/session/event/${eventId}/tracks`,
      { withCredentials: true }
    );
  }

  createSession(eventId: string, sessionData: SessionCreateRequest): Observable<SessionImportData> {
    return this.http.post<any>(
      `${environment.apiUrl}/session/event/${eventId}`,
      sessionData,
      { withCredentials: true }
    ).pipe(
      map(sessionData => this.convertSessionDates(sessionData))
    );
  }

  getEmptySessionsForEvent(eventId: string): Observable<SessionImportData[]> {
    return this.http.get<SessionImportData[]>(
      `${environment.apiUrl}/session/event/${eventId}/empty-sessions`,
      { withCredentials: true }
    ).pipe(
      map(sessions => sessions.map(session => this.convertSessionDates(session)))
    );
  }
}
