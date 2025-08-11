import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';
import {environment} from '../../../../environments/environment.development';
import {catchError, map} from 'rxjs/operators';
import {SessionImportData} from '../../../feature/admin-management/type/session/session';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../../login/services/auth.service';
import {UserSpeakerProfile} from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserSpeakerService {
  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  getProfile(eventId: string): Observable<UserSpeakerProfile> {
    return this.http.get<UserSpeakerProfile>(`${environment.apiUrl}/user-speaker/profile/event/${eventId}`, {
      withCredentials: true
    });
  }

  syncSpeakerData(eventId: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/user-speaker/sync/event/${eventId}`, {}, {
      withCredentials: true
    });
  }

  getSpeakerEvents(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/user-speaker/events`, {
      withCredentials: true
    });
  }

  isSpeakerForEvent(eventId: string): Observable<boolean> {
    return this.getSpeakerEvents().pipe(
      map(eventIds => eventIds.includes(eventId)),
      catchError(() => of(false))
    );
  }

  getUserSessions(eventId: string): Observable<SessionImportData[]> {
    return this.getProfile(eventId).pipe(
      map(profile => [...profile.sessions]),
      catchError(() => of([]))
    );
  }
}
