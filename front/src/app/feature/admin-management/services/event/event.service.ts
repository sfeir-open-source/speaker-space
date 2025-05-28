import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';
import { Event } from '../../type/event/event';
import {EventDTO} from '../../type/event/eventDTO';

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
      return throwError(() => new Error('Event ID is missing 8'));
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

  getEventById(id: string): Observable<any> {
    return this.http.get<Event>(`${environment.apiUrl}/event/${id}`, { withCredentials: true })
      .pipe(
        catchError(error => {
          return throwError(() => ({
            error: error.error || 'Unknown error',
            status: error.status,
            message: 'Failed to load event'
          }));
        })
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
          const updated : Event[] = this.eventsSubject.value.filter(event => event.idEvent !== id);
          this.eventsSubject.next(updated);
        }),
        catchError(this.handleError('Error deleting event'))
      );
  }

  uploadEventLogo(eventId: string, formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/events/${eventId}/logo`, formData);
  }
}
