import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Speaker} from '../../type/session/session';
import {environment} from '../../../../../environments/environment.development';
import {EmailEncoderService} from '../../components/services/email-encoder.service';

@Injectable({
  providedIn: 'root'
})
export class SpeakerService {

  constructor(
    private http: HttpClient,
    private emailEncoderService: EmailEncoderService
  ) {}

  getSpeakerByEmail(eventId: string, email: string): Observable<Speaker> {
    const encodedEmail = this.emailEncoderService.encodeToBase64(email);

    return this.http.get<Speaker>(
      `${environment.apiUrl}/session/event/${eventId}/speaker/${encodedEmail}`,
      { withCredentials: true }
    );
  }
}
