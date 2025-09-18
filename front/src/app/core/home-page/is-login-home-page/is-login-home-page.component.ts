import { Component, computed, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {
  EventTeamCardComponent
} from '../../../feature/admin-management/components/event/event-team-card/event-team-card.component';
import { EventService } from '../../../feature/admin-management/services/event/event.service';
import { EventStatusService } from '../../../feature/admin-management/services/event/event-status.service';
import {
  EventTeamField
} from '../../../feature/admin-management/components/event/event-team-card/interface/event-team-field';
import { Event } from '../../../feature/admin-management/type/event/event';

@Component({
  selector: 'app-is-login-home-page',
  standalone: true,
  imports: [CommonModule, EventTeamCardComponent],
  templateUrl: './is-login-home-page.component.html',
  styleUrl: './is-login-home-page.component.scss'
})
export class IsLoginHomePageComponent {
  activeTab = signal<'currents' | 'passed'>('currents');
  userEvents = signal<Event[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  private eventService = inject(EventService);
  private eventStatusService = inject(EventStatusService);

  eventCounts = computed(() => {
    let currentCount = 0;
    let passedCount = 0;

    this.userEvents().forEach(event => {
      const status = this.eventStatusService.getEventStatus(event);
      if (status.isFinished) {
        passedCount++;
      } else {
        currentCount++;
      }
    });

    return { current: currentCount, passed: passedCount };
  });

  private filteredAndSortedEvents = computed(() => {
    const filteredEvents = this.eventStatusService.filterEventsByStatus(
      this.userEvents(),
      this.activeTab() === 'passed'
    );

    return this.sortEventsByDate(filteredEvents);
  });

  displayedEvents = computed(() =>
    this.transformEventsToFields(this.filteredAndSortedEvents())
  );
  hasEvents = computed(() => this.displayedEvents().length > 0);

  emptyStateMessage = computed(() => {
    const counts = this.eventCounts();
    if (this.activeTab() === 'currents') {
      return counts.current === 0
        ? 'No current events found.'
        : 'No current events to display.';
    } else {
      return counts.passed === 0
        ? 'No past events found.'
        : 'No past events to display.';
    }
  });

  constructor() {
    effect(() => {
      if (this.userEvents().length === 0 && !this.isLoading()) {
        this.loadUserEvents();
      }
    }, { allowSignalWrites: true });
    this.loadUserEvents();
  }

  private loadUserEvents(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.eventService.getAllUserRelatedEvents()
      .pipe(
        takeUntilDestroyed(),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (events: Event[]) => {
          this.userEvents.set(events);
        },
        error: (err: any) => {
          console.error('Error loading user events:', err);
          this.error.set('Failed to load your events');
          this.userEvents.set([]);
        }
      });
  }

  private transformEventsToFields(events: Event[]): EventTeamField[] {
    return events.map(event => {
      const status = this.eventStatusService.getEventStatus(event);

      return {
        idEvent: event.idEvent ?? '',
        title: event.eventName ?? 'Untitled Event',
        type: event.type ?? 'Unknown',
        img: event.logoBase64 || 'assets/img/logo-speaker-space.svg',
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

  private sortEventsByDate(events: Event[]): Event[] {
    return events.sort((a, b) => {
      const dateA = new Date(a.startDate || a.endDate || '');
      const dateB = new Date(b.startDate || b.endDate || '');

      if (this.activeTab() === 'currents') {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });
  }

  setActiveTab(tab: 'currents' | 'passed'): void {
    this.activeTab.set(tab);
  }
}
