import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';
import { Event, EventDTO } from '../../type/event/event';
import { AuthService } from '../../../../core/login/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private eventsSubject = new BehaviorSubject<Event[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadUserEvents();
  }

  private handleError(operation: string) {
    return (error: any) => {
      console.error(`${operation}:`, error);
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

  createEvent(event: EventDTO): Observable<EventDTO> {
    return this.http.post<EventDTO>(
      `${environment.apiUrl}/event/create`,
      event,
      { withCredentials: true }
    ).pipe(
      tap(response => console.log('Event creation response:', response)),
      catchError(error => {
        return this.handleError('Error creating event')(error);
      })
    );
  }


  updateEvent(event: EventDTO): Observable<EventDTO> {

    if (!event.idEvent) {
      return throwError(() => new Error('Event ID is missing'));
    }

    return this.http.put<EventDTO>(
      `${environment.apiUrl}/event/${event.idEvent}`,
      event,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        }),
        withCredentials: true
      }
    ).pipe(
      tap(response => console.log('Event update response:', response)),
      catchError(error => {
        return this.handleError('Error updating event')(error);
      })
    );
  }

  getEventById(id: string): Observable<Event> {
    return this.http.get<Event>(`${environment.apiUrl}/event/${id}`, { withCredentials: true })
      .pipe(catchError(this.handleError('Error getting event by ID')));
  }

  getEventByUrl(urlId: string): Observable<Event> {
    return this.http.get<Event>(`${environment.apiUrl}/event/by-url/${urlId}`, { withCredentials: true })
      .pipe(catchError(this.handleError('Error getting event by URL')));
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
}
