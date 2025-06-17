import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Speaker} from '../../type/session/session';
import {environment} from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SpeakerService {

  constructor(private http: HttpClient) {}

  getSpeakerByName(eventId: string, speakerName: string): Observable<Speaker> {
    const encodedSpeakerName = encodeURIComponent(speakerName);
    return this.http.get<Speaker>(
      `${environment.apiUrl}/session/event/${eventId}/speaker/${encodedSpeakerName}`,
      { withCredentials: true }
    );
  }
}
