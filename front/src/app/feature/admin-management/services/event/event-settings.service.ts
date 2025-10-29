import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventService } from './event.service';
import { EventDataService } from './event-data.service';
import { EventDTO } from '../../type/event/eventDTO';
import {EventVisibility, UserRole} from '../../type/event/event-visibility';

@Injectable()
export class EventSettingsService {
  private readonly eventService = inject(EventService);
  private readonly eventDataService = inject(EventDataService);
  private readonly destroyRef = inject(DestroyRef);

  readonly eventId = signal<string>('');
  readonly eventUrl = signal<string>('');
  readonly eventName = signal<string>('');
  readonly teamUrl = signal<string>('');
  readonly teamId = signal<string>('');
  readonly visibility = signal<EventVisibility>('private');
  readonly currentUserRole = signal<UserRole>('Owner');

  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly eventInformationData = signal<Partial<EventDTO> | null>(null);
  readonly eventGeneralData = signal<Partial<EventDTO> | null>(null);

  readonly hasEventData = computed(() =>
    !!this.eventGeneralData() && !!this.eventInformationData()
  );

  loadEventData(eventId: string): void {
    if (!eventId) {
      this.error.set('Event ID is required to load event data');
      this.isLoading.set(false);
      return;
    }

    this.eventId.set(eventId);
    this.isLoading.set(true);

    this.eventService.getEventById(eventId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (event) => this.handleEventDataLoaded(event),
        error: (err) => this.handleEventDataError(err)
      });
  }

  private handleEventDataLoaded(event: EventDTO): void {
    this.eventId.set(event.idEvent || this.eventId());
    this.eventName.set(event.eventName || '');
    this.eventUrl.set(event.url || '');
    this.teamUrl.set(event.teamUrl || '');
    this.teamId.set(event.teamId || '');
    this.currentUserRole.set('Owner');
    this.visibility.set(event.privateEvent === true ? 'private' : 'public');

    this.eventGeneralData.set({
      idEvent: this.eventId(),
      eventName: event.eventName,
      url: event.url,
      conferenceHallUrl: event.conferenceHallUrl,
      timeZone: event.timeZone || 'Europe/Paris',
      privateEvent: event.privateEvent === true,
      type: event.type,
    });

    this.eventInformationData.set({
      idEvent: this.eventId(),
      startDate: event.startDate,
      endDate: event.endDate,
      online: event.online,
      location: event.location,
      description: event.description,
      webLinkUrl: event.webLinkUrl
    });

    this.eventDataService.loadEvent({
      idEvent: event.idEvent || this.eventId(),
      eventName: event.eventName || '',
      teamId: event.teamId || '',
      url: event.url || '',
      teamUrl: event.teamUrl,
      webLinkUrl: event.webLinkUrl,
      type: event.type,
    });

    this.error.set(null);
  }

  private handleEventDataError(err: unknown): void {
    this.error.set('Failed to load event details. Please try again.');
    console.error('Error loading event data:', err);
  }
}
