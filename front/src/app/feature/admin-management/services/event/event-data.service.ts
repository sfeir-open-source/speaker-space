import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventDataService {
  private eventNameSubject = new BehaviorSubject<string>('');
  eventName$ = this.eventNameSubject.asObservable();

  private eventIdSubject = new BehaviorSubject<string>('');
  eventId$ = this.eventIdSubject.asObservable();

  private nextStepSubject = new Subject<void>();
  nextStep$ = this.nextStepSubject.asObservable();

  setEventName(name: string): void {
    this.eventNameSubject.next(name);
  }

  setEventId(id: string): void {
    this.eventIdSubject.next(id);
  }

  goToNextStep(): void {
    this.nextStepSubject.next();
  }
}
