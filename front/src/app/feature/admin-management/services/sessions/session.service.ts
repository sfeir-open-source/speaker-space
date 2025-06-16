import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {SessionImportData} from '../../type/session/session';
import {Observable} from 'rxjs';
import {environment} from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private http: HttpClient) {}

  getSessionsByEventId(eventId: string): Observable<SessionImportData[]> {
    return this.http.get<SessionImportData[]>(`${environment.apiUrl}/event/${eventId}/sessions`);
  }

  getSessionById(eventId: string, sessionId: string): Observable<SessionImportData> {
    return this.http.get<SessionImportData>(`${environment.apiUrl}/event/${eventId}/sessions/${sessionId}`);
  }
}
