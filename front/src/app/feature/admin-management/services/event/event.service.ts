import { Injectable } from '@angular/core';
import {BehaviorSubject, from, Observable, of, switchMap, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';
import { Event } from '../../type/event/event';
import {EventDTO} from '../../type/event/eventDTO';
import {ImportResult, SessionImportData, SessionImportRequest, Speaker} from '../../type/session/session';
import {AuthService} from '../../../../core/login/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private eventsSubject = new BehaviorSubject<Event[]>([]);
  private readonly CACHE_DURATION = 5 * 60 * 1000;
  private eventCache = new Map<string, { data: EventDTO; timestamp: number }>();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadUserEvents();
  }

  updateEvent(event: Partial<EventDTO>): Observable<EventDTO> {
    if (!event.idEvent) {
      return throwError(() => new Error('Event ID is missing'));
    }

    const cleanEvent = this.removeUndefinedFields(event);

    return this.http.put<EventDTO>(
      `${environment.apiUrl}/event/${event.idEvent}`,
      cleanEvent,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        withCredentials: true
      }
    ).pipe(
      tap(response => this.updateEventCache(response)),
      catchError(this.handleError('Error updating event'))
    );
  }

  getEventById(id: string): Observable<EventDTO> {
    const cached = this.eventCache.get(id);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return of(cached.data);
    }

    return this.http.get<EventDTO>(`${environment.apiUrl}/event/${id}`, { withCredentials: true })
      .pipe(
        tap(event => this.updateEventCache(event)),
        catchError(this.handleError('Failed to load event'))
      );
  }

  createEvent(event: EventDTO): Observable<EventDTO> {
    return this.http.post<EventDTO>(
      `${environment.apiUrl}/event/create`,
      event,
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError('Error creating event'))
    );
  }

  getEventsByTeam(teamId: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${environment.apiUrl}/event/by-team/${teamId}`, { withCredentials: true })
      .pipe(catchError(this.handleError('Error getting events by team')));
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/event/${id}`, { withCredentials: true })
      .pipe(
        tap(() => {
          const updated = this.eventsSubject.value.filter(event => event.idEvent !== id);
          this.eventsSubject.next(updated);
        }),
        catchError(this.handleError('Error deleting event'))
      );
  }

  importSessions(eventId: string, sessionsData: SessionImportData[]): Observable<ImportResult> {
    const importRequest: SessionImportRequest = {
      eventId: eventId,
      sessions: sessionsData
    };

    return from(this.getAuthToken()).pipe(
      switchMap(token => {
        const headers = this.buildHeaders(token);
        return this.http.post<ImportResult>(
          `${environment.apiUrl}/session/event/${eventId}/import`,
          importRequest,
          { headers, withCredentials: true }
        );
      }),
      catchError(error => throwError(() => error))
    );
  }

  getSessionsByEventId(eventId: string): Observable<SessionImportData[]> {
    return this.http.get<SessionImportData[]>(
      `${environment.apiUrl}/session/event/${eventId}`,
      { withCredentials: true }
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getSpeakersByEventId(eventId: string): Observable<Speaker[]> {
    return this.http.get<Speaker[]>(
      `${environment.apiUrl}/session/event/${eventId}/speakers`,
      {
        withCredentials: true,
        headers: this.getHeaders()
      }
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  private removeUndefinedFields(obj: any): any {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined && obj[key] !== null) {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  }

  private updateEventCache(event: EventDTO): void {
    if (event.idEvent) {
      this.eventCache.set(event.idEvent, {
        data: event,
        timestamp: Date.now()
      });
    }
  }

  private handleError(operation: string) {
    return (error: any) => {
      return throwError(() => ({
        error: error.error || {},
        status: error.status,
        message: error.error?.message || 'An unknown error occurred'
      }));
    };
  }

  private loadUserEvents(): void {
    this.http.get<Event[]>(`${environment.apiUrl}/event/my-events`, { withCredentials: true })
      .pipe(catchError(this.handleError('Error loading events')))
      .subscribe(events => this.eventsSubject.next(events));
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await this.authService.getCurrentUserToken();
    } catch (error) {
      return null;
    }
  }

  private buildHeaders(token: string | null): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }
}
