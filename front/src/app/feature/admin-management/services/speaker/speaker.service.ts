import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Speaker} from '../../type/session/session';
import {environment} from '../../../../../environments/environment.development';
import {SpeakerWithSessionsDTO} from '../../type/speaker/speaker-with-sessions';

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
}
