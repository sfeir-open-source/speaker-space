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

  getSpeakerByEmail(eventId: string, email: string): Observable<Speaker> {
    const encodedEmail: string = this.encodeEmailToBase64(email);

    return this.http.get<Speaker>(
      `${environment.apiUrl}/session/event/${eventId}/speaker/${encodedEmail}`,
      { withCredentials: true }
    );
  }

  private encodeEmailToBase64(email: string): string {
    if (!email || email.trim() === '') {
      throw new Error('Email cannot be null or empty');
    }

    const encoded = btoa(email)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return encoded;
  }
}
