import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {SessionImportData} from '../../type/session/session';
import {environment} from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private http: HttpClient) {}

  getSessionById(eventId: string, sessionId: string): Observable<SessionImportData> {
    return this.http.get<SessionImportData>(
      `${environment.apiUrl}/session/event/${eventId}/session/${sessionId}`,
      { withCredentials: true }
    );
  }
}
