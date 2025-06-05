import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {SessionDTO} from '../../type/session/sessionDTO';
import {environment} from '../../../../../environments/environment.development';
import {catchError} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  constructor(private http: HttpClient) {}

  getSessionsByEventId(eventId: string): Observable<SessionDTO[]> {
    return this.http.get<SessionDTO[]>(
      `${environment.apiUrl}/event/${eventId}/sessions`,
      { withCredentials: true }
    ).pipe(
      catchError(error => {
        console.error('Error loading sessions:', error);
        return throwError(() => error);
      })
    );
  }
}
