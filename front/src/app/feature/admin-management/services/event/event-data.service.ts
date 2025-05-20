import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {EventDTO} from '../../type/event/event';

@Injectable({
  providedIn: 'root'
})
export class EventDataService {
  private eventNameSubject = new BehaviorSubject<string>('');
  eventName$ = this.eventNameSubject.asObservable();

  private eventIdSubject = new BehaviorSubject<string>('');
  eventId$ = this.eventIdSubject.asObservable();

  private eventSubject = new BehaviorSubject<EventDTO>({} as EventDTO);
  event$ = this.eventSubject.asObservable();

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

  updateEventData(partial: Partial<EventDTO>) {
    const current = this.eventSubject.getValue();
    this.eventSubject.next({ ...current, ...partial });
  }

  getCurrentEvent(): EventDTO {
    return this.eventSubject.getValue();
  }

  goToNextStep(): void {
    this.nextStepSubject.next();
  }

  resetEventData(): void {
    this.eventSubject.next({} as EventDTO);
    this.eventNameSubject.next('');
    this.eventIdSubject.next('');
  }

  loadEvent(event: EventDTO): void {
    this.eventIdSubject.next(event.idEvent || '');
    this.eventNameSubject.next(event.eventName || '');
    this.eventSubject.next(event);
  }
}
