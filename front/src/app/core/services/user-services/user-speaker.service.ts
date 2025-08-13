import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment.development';
import {catchError, map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {UserSpeakerProfile} from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserSpeakerService {
  constructor(
    private readonly http: HttpClient,
  ) {}

  getProfile(eventId: string): Observable<UserSpeakerProfile> {
    return this.http.get<any>(
      `${environment.apiUrl}/user-speaker/profile/event/${eventId}`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        const profileData = response.body || response;

        const profile: UserSpeakerProfile = {
          user: profileData.user || {},
          speakers: profileData.speakers || [],
          sessions: profileData.sessions || [],
          eventId: profileData.eventId || eventId
        };

        return profile;
      }),
      catchError(error => {
        console.error('Error fetching user speaker profile:', error);
        throw error;
      })
    );
  }


  syncSpeakerData(eventId: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/user-speaker/sync/event/${eventId}`,
      {},
      { withCredentials: true }
    );
  }
}
