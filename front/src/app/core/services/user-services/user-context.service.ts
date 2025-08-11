import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of, switchMap} from 'rxjs';
import {environment} from '../../../../environments/environment.development';
import {catchError, map} from 'rxjs/operators';
import {SessionImportData, Speaker} from '../../../feature/admin-management/type/session/session';
import {convertToDate} from '../../../feature/admin-management/utils/date.utils';
import {SpeakerProfile} from '../../models/user.model';
import {UserSpeakerService} from './user-speaker.service';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  constructor(
    private http: HttpClient,
    private userSpeakerService: UserSpeakerService
  ) {}

  isUserSpeakerOfEvent(eventId: string): Observable<boolean> {
    return this.userSpeakerService.isSpeakerForEvent(eventId);
  }

  getMyProfileForEvent(eventId: string): Observable<SpeakerProfile | null> {
    return this.userSpeakerService.getProfile(eventId).pipe(
      map(profile => profile.speakers.length > 0 ? profile.speakers[0] : null),
      catchError(error => {
        console.error('Error loading speaker profile:', error);
        return of(null);
      })
    );
  }

  getMySessionById(eventId: string, sessionId: string): Observable<SessionImportData | null> {
    return this.userSpeakerService.getProfile(eventId).pipe(
      map(profile => {
        const session = profile.sessions.find(s => s.id === sessionId);
        return session ? this.convertSessionDates(session) : null;
      }),
      catchError(error => {
        console.error('Error loading session:', error);
        return of(null);
      })
    );
  }

  getSessionsForCurrentUser(eventId: string): Observable<SessionImportData[]> {
    return this.userSpeakerService.getUserSessions(eventId).pipe(
      map(sessions => sessions.map(session => this.convertSessionDates(session)))
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
