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
  ) { }

  createEvent(event: Event): Observable<Event> {
    return this.http.post<Event>(`${environment.apiUrl}/event/create`, event, { withCredentials: true })
      .pipe(
        map(newEvent => ({
          ...newEvent,
          id: newEvent.idEvent || ''
        })),
        tap(newEvent => {
          const currentEvents = this.eventsSubject.value;
          this.eventsSubject.next([...currentEvents, newEvent]);
        }),
        catchError(this.handleError('Error creating event'))
      );
  }

  private handleError(operation: string) {
    return (error: any) => {
      return throwError(() => ({
        error: error.error || {},
        status: error.status,
        message: error.error?.message || 'An unknown error occurred',
      }));
    };
  }
}
