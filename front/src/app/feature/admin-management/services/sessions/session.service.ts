import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {SessionImportData} from '../../type/session/session';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../../environments/environment.development';
import {map} from 'rxjs/operators';
import {convertToDate} from '../../utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private http: HttpClient) {}

  getSessionById(eventId: string, sessionId: string): Observable<SessionImportData> {
    return this.http.get<any>(
      `${environment.apiUrl}/session/event/${eventId}/session/${sessionId}`,
      { withCredentials: true }
    ).pipe(
      map(sessionData => this.convertSessionDates(sessionData))
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
