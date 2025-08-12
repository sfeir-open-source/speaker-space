import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {SessionImportData, Speaker} from '../../../feature/admin-management/type/session/session';
import {convertToDate} from '../../../feature/admin-management/utils/date.utils';
import {SpeakerProfile, UserSpeakerProfile} from '../../models/user.model';
import {UserSpeakerService} from './user-speaker.service';
import {SpeakerMapperService} from '../../../feature/admin-management/services/speaker/speaker-mapper.service';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  constructor(
    private http: HttpClient,
    private userSpeakerService: UserSpeakerService,
    private speakerMapper: SpeakerMapperService
  ) {}

  getMyProfileForEvent(eventId: string): Observable<Speaker | null> {
    return this.userSpeakerService.getProfile(eventId).pipe(
      map((profile: UserSpeakerProfile) => {
        if (!this.isValidUserSpeakerProfile(profile)) {
          return null;
        }

        const speakerProfile = profile.speakers[0];
        return this.speakerMapper.mapSpeakerProfileToSpeaker(speakerProfile);
      }),
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

  private isValidUserSpeakerProfile(profile: UserSpeakerProfile): boolean {
    return profile &&
      Array.isArray(profile.speakers) &&
      profile.speakers.length > 0 &&
      this.isValidSpeakerProfile(profile.speakers[0]);
  }

  private isValidSpeakerProfile(speaker: SpeakerProfile): boolean {
    return speaker &&
      typeof speaker.id === 'string' &&
      typeof speaker.name === 'string' &&
      typeof speaker.email === 'string';
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
