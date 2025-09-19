import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {EventDTO} from '../../type/event/eventDTO';

@Injectable({
  providedIn: 'root'
})
export class EventDataService {
  private eventNameSubject : BehaviorSubject<string> = new BehaviorSubject<string>('');
  eventName$: Observable<string>  = this.eventNameSubject.asObservable();

  private eventIdSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  eventId$: Observable<string> = this.eventIdSubject.asObservable();

  private teamIdSubject : BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  teamId$ : Observable<string | null> = this.teamIdSubject.asObservable();

  private eventSubject: BehaviorSubject<EventDTO> = new BehaviorSubject<EventDTO>({} as EventDTO);
  event$: Observable<EventDTO> = this.eventSubject.asObservable();

  private nextStepSubject:Subject<void> = new Subject<void>();
  nextStep$ : Observable<void> = this.nextStepSubject.asObservable();

  setEventName(name: string): void {
    this.eventNameSubject.next(name);
    this.updateEventData({ eventName: name });
  }

  setEventId(idEvent: string): void {
    this.eventIdSubject.next(idEvent);
    this.updateEventData({ idEvent: idEvent });
  }

  setTeamId(teamId: string): void {
    this.teamIdSubject.next(teamId);
    this.updateEventData({ teamId: teamId });
  }

  updateEventData(partial: Partial<EventDTO>) {
    const current : EventDTO = this.eventSubject.getValue();
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
    this.teamIdSubject.next(null);
  }

  loadEvent(event: EventDTO): void {
    this.eventIdSubject.next(event.idEvent || '');
    this.eventNameSubject.next(event.eventName || '');
    this.teamIdSubject.next(event.teamId || null);
    this.eventSubject.next(event);
  }
}
