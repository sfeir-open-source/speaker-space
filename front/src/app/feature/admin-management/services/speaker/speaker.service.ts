import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Speaker} from '../../type/session/session';
import {environment} from '../../../../../environments/environment.development';
import {EmailEncoderService} from '../../components/services/email-encoder.service';
import {SpeakerWithSessionsDTO} from '../../type/speaker/speaker-with-sessions';

@Injectable({
  providedIn: 'root'
})
export class SpeakerService {

  constructor(
    private http: HttpClient,
    private emailEncoderService: EmailEncoderService
  ) {}

  getSpeakerByEmail(eventId: string, email: string): Observable<Speaker> {
    const encodedEmail : string = this.emailEncoderService.encodeToBase64(email);

    return this.http.get<Speaker>(
      `${environment.apiUrl}/session/event/${eventId}/speaker/${encodedEmail}`,
      { withCredentials: true }
    );
  }

  getSpeakersWithSessionsByEventId(eventId: string): Observable<SpeakerWithSessionsDTO[]> {
    return this.http.get<SpeakerWithSessionsDTO[]>(`${environment.apiUrl}/session/event/${eventId}/speakers-with-sessions`);
  }
}
