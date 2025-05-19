import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../../environments/environment.development';
import {Event} from '../../type/event/event';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private eventsSubject = new BehaviorSubject<Event[]>([]);

  constructor(
    private http: HttpClient,
  ) {
    this.loadUserEvents();
  }

  loadUserEvents(): void {
    this.http.get<Event[]>(`${environment.apiUrl}/event/my-events`, {withCredentials: true})
      .pipe(
        catchError(this.handleError('Error loading events'))
      )
      .subscribe(events => {
        this.eventsSubject.next(events);
      });
  }

  createEvent(event: Event): Observable<Event> {
    return this.http.post<Event>(`${environment.apiUrl}/event/create`, event, {withCredentials: true})
      .pipe(
        tap(newEvent => {
          const currentEvents = this.eventsSubject.value;
          this.eventsSubject.next([...currentEvents, newEvent]);
        }),
        catchError(this.handleError('Error creating event'))
      );
  }

  updateEvent(event: Partial<Event>): Observable<Event> {
    return this.http.put<Event>(`${environment.apiUrl}/event/${event.idEvent}`, event, {withCredentials: true})
      .pipe(
        tap(updatedEvent => {
          const currentEvents = this.eventsSubject.value;
          const updatedEvents = currentEvents.map(e =>
            e.idEvent === updatedEvent.idEvent ? updatedEvent : e
          );
          this.eventsSubject.next(updatedEvents);
        }),
        catchError(this.handleError('Error updating event'))
      );
  }

  getEventById(id: string): Observable<Event> {
    return this.http.get<Event>(`${environment.apiUrl}/event/${id}`, {withCredentials: true})
      .pipe(
        catchError(this.handleError('Error getting event'))
      );
  }

  getEventByUrl(urlId: string): Observable<Event> {
    return this.http.get<Event>(`${environment.apiUrl}/event/by-url/${urlId}`, {withCredentials: true})
      .pipe(
        catchError(this.handleError('Error getting event by URL'))
      );
  }

  getEventsByTeam(teamId: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${environment.apiUrl}/event/by-team/${teamId}`, {withCredentials: true})
      .pipe(
        catchError(this.handleError('Error getting team events'))
      );
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/event/${id}`, {withCredentials: true})
      .pipe(
        tap(() => {
          const currentEvents = this.eventsSubject.value;
          const updatedEvents = currentEvents.filter(e => e.idEvent !== id);
          this.eventsSubject.next(updatedEvents);
        }),
        catchError(this.handleError('Error deleting event'))
      );
  }

  private handleError(operation: string) {
    return (error: any) => {
      console.error(`${operation}:`, error);
      return throwError(() => ({
        error: error.error || {},
        status: error.status,
        message: error.error?.message || 'An unknown error occurred',
      }));
    };
  }
}
