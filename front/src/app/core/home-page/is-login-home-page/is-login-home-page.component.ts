import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {
  EventTeamCardComponent
} from '../../../feature/admin-management/components/event/event-team-card/event-team-card.component';
import {EventService} from '../../../feature/admin-management/services/event/event.service';
import {EventStatusService} from '../../../feature/admin-management/services/event/event-status.service';
import {
  EventTeamField
} from '../../../feature/admin-management/components/event/event-team-card/interface/event-team-field';
import {Event} from '../../../feature/admin-management/type/event/event';

@Component({
  selector: 'app-is-login-home-page',
  standalone: true,
  imports: [CommonModule, EventTeamCardComponent],
  templateUrl: './is-login-home-page.component.html',
  styleUrl: './is-login-home-page.component.scss'
})
export class IsLoginHomePageComponent implements OnInit {
  activeTab: 'currents' | 'passed' = 'currents';
  userEvents: Event[] = [];
  displayedEvents: EventTeamField[] = [];
  eventCounts = { current: 0, passed: 0 };
  isLoading: boolean = true;
  error: string | null = null;

  private readonly _destroyRef = inject(DestroyRef);

  constructor(
    private eventService: EventService,
    private eventStatusService: EventStatusService
  ) {}

  ngOnInit(): void {
    this.loadUserEvents();
  }

  private loadUserEvents(): void {
    this.isLoading = true;
    this.error = null;

    this.eventService.getAllUserRelatedEvents()
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (events: Event[]) => {
          this.userEvents = events;
          this.updateEventCounts();
          this.updateDisplayedEvents();
        },
        error: (err: any) => {
          console.error('Error loading user events:', err);
          this.error = 'Failed to load your events';
          this.userEvents = [];
          this.displayedEvents = [];
        }
      });
  }

  private updateEventCounts(): void {
    let currentCount : number = 0;
    let passedCount : number = 0;

    this.userEvents.forEach(event => {
      const status = this.eventStatusService.getEventStatus(event);
      if (status.isFinished) {
        passedCount++;
      } else {
        currentCount++;
      }
    });

    this.eventCounts = { current: currentCount, passed: passedCount };
  }

  private transformEventsToFields(events: Event[]): EventTeamField[] {
    return events.map(event => {
      const status = this.eventStatusService.getEventStatus(event);

      return {
        idEvent: event.idEvent ?? '',
        title: event.eventName ?? 'Untitled Event',
        type: event.type ?? 'Unknown',
        img: event.logoBase64 || 'img/logo-speaker-space.svg',
        link: event.webLinkUrl ?? '',
        statusText: status.statusText,
        statusClass: status.statusClass,
        publicUrl: event.url ?? '',
        logoBase64: event.logoBase64,
        daysRemaining: status.daysRemaining,
        isFinished: status.isFinished
      };
    });
  }

  private updateDisplayedEvents(): void {
    const filteredEvents = this.eventStatusService.filterEventsByStatus(
      this.userEvents,
      this.activeTab === 'passed'
    );

    const sortedEvents = this.sortEventsByDate(filteredEvents);
    this.displayedEvents = this.transformEventsToFields(sortedEvents);
  }

  private sortEventsByDate(events: Event[]): Event[] {
    return events.sort((a, b) => {
      const dateA = new Date(a.startDate || a.endDate || '');
      const dateB = new Date(b.startDate || b.endDate || '');

      if (this.activeTab === 'currents') {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });
  }

  setActiveTab(tab: 'currents' | 'passed'): void {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      this.updateDisplayedEvents();
    }
  }

  get hasEvents(): boolean {
    return this.displayedEvents.length > 0;
  }

  get emptyStateMessage(): string {
    if (this.activeTab === 'currents') {
      return this.eventCounts.current === 0
        ? 'No current events found.'
        : 'No current events to display.';
    } else {
      return this.eventCounts.passed === 0
        ? 'No past events found.'
        : 'No past events to display.';
    }
  }
}
