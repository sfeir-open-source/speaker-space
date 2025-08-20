import { Injectable } from '@angular/core';
import {Observable, of, switchMap} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {SessionImportData, Speaker} from '../../../feature/admin-management/type/session/session';
import {convertToDate} from '../../../feature/admin-management/utils/date.utils';
import {UserSpeakerProfile} from '../../models/user.model';
import {UserSpeakerService} from './user-speaker.service';
import {SpeakerMapperService} from '../../../feature/admin-management/services/speaker/speaker-mapper.service';
import {SessionService} from '../../../feature/admin-management/services/sessions/session.service';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  constructor(
    private userSpeakerService: UserSpeakerService,
    private speakerMapper: SpeakerMapperService,
    private sessionService: SessionService
  ) {}

  getMyProfileForEvent(eventId: string): Observable<Speaker | null> {
    return this.userSpeakerService.getProfile(eventId).pipe(
      map((profile: UserSpeakerProfile) => {
        if (!this.isValidUserSpeakerProfile(profile)) {
          console.warn('Invalid profile structure:', profile);
          return null;
        }
        const speakerProfile = profile.speakers[0];
        const mappedSpeaker = this.speakerMapper.mapSpeakerProfileToSpeaker(speakerProfile);
        return mappedSpeaker;
      }),
      catchError(error => {
        console.error('Error loading speaker profile:', error);
        return of(null);
      })
    );
  }

  getMySessionById(eventId: string, sessionId: string): Observable<SessionImportData | null> {
    return this.sessionService.getSessionById(eventId, sessionId).pipe(
      catchError(error => {
        console.error('Error loading session via unified endpoint:', error);
        return this.getMySessionByIdFromProfile(eventId, sessionId);
      })
    );
  }

  private getMySessionByIdFromProfile(eventId: string, sessionId: string): Observable<SessionImportData | null> {
    return this.userSpeakerService.getProfile(eventId).pipe(
      map(profile => {
        const session = profile.sessions.find(s => s.id === sessionId);
        if (!session) {
          console.warn(`Session ${sessionId} not found in profile`);
          return null;
        }
        return this.convertSessionDates(session);
      }),
      catchError(error => {
        console.error('Error loading session from profile:', error);
        return of(null);
      })
    );
  }

  private isValidUserSpeakerProfile(profile: UserSpeakerProfile): boolean {
    const isValid: boolean = profile &&
      Array.isArray(profile.speakers) &&
      profile.speakers.length > 0 &&
      Array.isArray(profile.sessions);
    return isValid;
  }

  getSessionsForCurrentUser(eventId: string): Observable<SessionImportData[]> {
    return this.userSpeakerService.getProfile(eventId).pipe(
      switchMap(profile => {
        if (!this.isValidUserSpeakerProfile(profile)) {
          return of([]);
        }

        const speakerEmail :  string = profile.speakers[0]?.email;
        if (!speakerEmail) {
          return of([]);
        }

        return this.sessionService.getSessionsByEventId(eventId).pipe(
          map(sessions => sessions.filter(session =>
            session.speakers?.some(speaker =>
              speaker.email?.toLowerCase() === speakerEmail.toLowerCase()
            )
          ))
        );
      }),
      catchError(error => {
        console.error('Error loading sessions via unified endpoint:', error);
        return this.getSessionsFromProfile(eventId);
      })
    );
  }



  private getSessionsFromProfile(eventId: string): Observable<SessionImportData[]> {
    return this.userSpeakerService.getProfile(eventId).pipe(
      map(profile => {
        if (!profile.sessions || !Array.isArray(profile.sessions)) {
          console.warn('No sessions found in profile');
          return [];
        }
        return profile.sessions.map(session => this.convertSessionDates(session));
      }),
      catchError(error => {
        console.error('Error loading user sessions from profile:', error);
        return of([]);
      })
    );
  }

  private convertSessionDates(sessionData: any): SessionImportData {
    return {
      ...sessionData,
      start: convertToDate(sessionData.start),
      end: convertToDate(sessionData.end),
      createdAt: sessionData.createdAt ? convertToDate(sessionData.createdAt)?.toISOString() : undefined,
      updatedAt: sessionData.updatedAt ? convertToDate(sessionData.updatedAt)?.toISOString() : undefined,
      abstractText: sessionData.abstractText || sessionData.abstract || undefined
    };
  }
}
