import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of, switchMap} from 'rxjs';
import {environment} from '../../../../environments/environment.development';
import {catchError, map} from 'rxjs/operators';
import {SessionImportData, Speaker} from '../../../feature/admin-management/type/session/session';
import {convertToDate} from '../../../feature/admin-management/utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {

  constructor(
    private http: HttpClient,
  ) {}

  isUserSpeakerOfEvent(eventId: string): Observable<boolean> {
    return this.http.get<{isSpeaker: boolean}>(
      `${environment.apiUrl}/event/${eventId}/is-speaker`,
      { withCredentials: true }
    ).pipe(
      map(response => response.isSpeaker),
      catchError(() => of(false))
    );
  }

  getSessionsForCurrentUser(eventId: string): Observable<SessionImportData[]> {
    return this.isUserSpeakerOfEvent(eventId).pipe(
      switchMap(isSpeaker => {
        if (isSpeaker) {
          return this.http.get<SessionImportData[]>(
            `${environment.apiUrl}/speaker-sessions/event/${eventId}`,
            { withCredentials: true }
          );
        } else {
          return this.http.get<SessionImportData[]>(
            `${environment.apiUrl}/session/event/${eventId}`,
            { withCredentials: true }
          );
        }
      }),
      map(sessions => {
        return sessions.map(session => this.convertSessionDates(session));
      }),
      catchError(error => {
        console.error('Error loading sessions for current user:', error);
        return of([]);
      })
    );
  }

  getMyProfileForEvent(eventId: string): Observable<Speaker> {
    return this.http.get<Speaker>(
      `${environment.apiUrl}/speaker-sessions/event/${eventId}/my-profile`,
      { withCredentials: true }
    ).pipe(
      catchError(error => {
        console.error('Error loading speaker profile:', error);
        throw error;
      })
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
