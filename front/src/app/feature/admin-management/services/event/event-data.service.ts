import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Event } from '../../type/event/event';

@Injectable({
  providedIn: 'root'
})
export class EventDataService {
  private eventNameSubject = new BehaviorSubject<string>('');
  eventName$ = this.eventNameSubject.asObservable();

  private eventIdSubject = new BehaviorSubject<string>('');
  eventId$ = this.eventIdSubject.asObservable();

  private eventDataSubject = new BehaviorSubject<Partial<Event>>({});
  eventData$ = this.eventDataSubject.asObservable();

  private nextStepSubject = new Subject<void>();
  nextStep$ = this.nextStepSubject.asObservable();

  setEventName(name: string): void {
    this.eventNameSubject.next(name);
    this.updateEventData({ eventName: name });
  }

  setEventId(idEvent: string): void {
    this.eventIdSubject.next(idEvent);
    this.updateEventData({ idEvent: idEvent });
  }

  updateEventData(data: Partial<Event>): void {
    const currentData = this.eventDataSubject.value;
    this.eventDataSubject.next({ ...currentData, ...data });
  }

  getEventData(): Partial<Event> {
    return this.eventDataSubject.value;
  }

  goToNextStep(): void {
    this.nextStepSubject.next();
  }

  resetEventData(): void {
    this.eventDataSubject.next({});
    this.eventNameSubject.next('');
    this.eventIdSubject.next('');
  }

  loadEvent(event: Event): void {
    this.eventIdSubject.next(event.idEvent || '');
    this.eventNameSubject.next(event.eventName || '');
    this.eventDataSubject.next(event);
  }
}
