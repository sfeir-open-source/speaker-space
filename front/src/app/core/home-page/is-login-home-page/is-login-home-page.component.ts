import { Component, computed, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { EventTeamCardComponent } from '../../../feature/admin-management/components/event/event-team-card/event-team-card.component';
import { EventService } from '../../../feature/admin-management/services/event/event.service';
import { EventStatusService } from '../../../feature/admin-management/services/event/event-status.service';
import { EventTeamField } from '../../../feature/admin-management/components/event/event-team-card/interface/event-team-field';
import { Event } from '../../../feature/admin-management/type/event/event';
import { ButtonComponent } from '../../../shared/button/button.component';
import { UserRoleService } from '../../services/user-services/user-role.service';

@Component({
  selector: 'app-is-login-home-page',
  standalone: true,
  imports: [CommonModule, EventTeamCardComponent, ButtonComponent],
  templateUrl: './is-login-home-page.component.html',
  styleUrl: './is-login-home-page.component.scss'
})
export class IsLoginHomePageComponent {
  readonly activeTab = signal<'currents' | 'passed'>('currents');
  readonly userEvents = signal<Event[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  private readonly eventService = inject(EventService);
  private readonly eventStatusService = inject(EventStatusService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly destroyRef = inject(DestroyRef);

  readonly eventCounts = computed(() => {
    const events = this.userEvents();
    let currentCount = 0;
    let passedCount = 0;

    events.forEach(event => {
      const status = this.eventStatusService.getEventStatus(event);
      if (status.isFinished) {
        passedCount++;
      } else {
        currentCount++;
      }
    });

    return { current: currentCount, passed: passedCount };
  });

  private readonly filteredAndSortedEvents = computed(() => {
    const filteredEvents = this.eventStatusService.filterEventsByStatus(
      this.userEvents(),
      this.activeTab() === 'passed'
    );

    return this.sortEventsByDate(filteredEvents);
  });

  readonly displayedEvents = computed(() =>
    this.transformEventsToFields(this.filteredAndSortedEvents())
  );

  readonly hasEvents = computed(() => this.displayedEvents().length > 0);

  readonly emptyStateMessage = computed(() => {
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

  readonly currentsTabClasses = computed(() => this.getTabClasses('currents'));
  readonly passedTabClasses = computed(() => this.getTabClasses('passed'));

  constructor() {
    this.loadUserEvents();
  }

  private getTabClasses(tab: 'currents' | 'passed'): string {
    const baseClasses = 'flex items-center rounded-md py-0.5 px-12 text-sm cursor-pointer transition-all';
    const activeClasses = this.activeTab() === tab
      ? 'bg-white text-primaryColor shadow-sm'
      : 'text-secondary hover:text-white';

    return `${baseClasses} ${activeClasses}`.trim();
  }

  getCurrentsTabClasses(): string {
    return this.currentsTabClasses();
  }

  getPassedTabClasses(): string {
    return this.passedTabClasses();
  }

  getCurrentsTabHandler(): () => void {
    return () => this.setActiveTab('currents');
  }

  getPassedTabHandler(): () => void {
    return () => this.setActiveTab('passed');
  }

  private loadUserEvents(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.eventService.getAllUserRelatedEvents()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (events: Event[]) => {
          this.userEvents.set(events);
        },
        error: (err: unknown) => {
          console.error('Error loading user events:', err);
          this.error.set('Failed to load your events. Please try again.');
          this.userEvents.set([]);
        }
      });
  }

  private transformEventsToFields(events: Event[]): EventTeamField[] {
    return events.map(event => {
      const status = this.eventStatusService.getEventStatus(event);
      const userRole = event.userRole || this.userRoleService.getUserRoleFromContext(event);

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
        isFinished: status.isFinished,
        userRole
      };
    });
  }

  private sortEventsByDate(events: Event[]): Event[] {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.startDate || a.endDate || '').getTime();
      const dateB = new Date(b.startDate || b.endDate || '').getTime();

      return this.activeTab() === 'currents'
        ? dateA - dateB
        : dateB - dateA;
    });
  }

  setActiveTab(tab: 'currents' | 'passed'): void {
    this.activeTab.set(tab);
  }
}
