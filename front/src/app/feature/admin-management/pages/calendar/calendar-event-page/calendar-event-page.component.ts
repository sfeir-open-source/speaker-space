import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass, AsyncPipe } from '@angular/common';
import { CalendarService } from '../../../services/calendar/calendar.service';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import { NavbarEventPageComponent } from '../../../components/event/navbar-event-page/navbar-event-page.component';
import { CalendarDayData, CalendarSession, CalendarSessionData } from '../../../type/calendar/calendar';
import { BaseListService, ListState } from '../../../components/services/base-list.service';

@Component({
  selector: 'app-calendar-event-page',
  templateUrl: './calendar-event-page.component.html',
  imports: [
    NavbarEventPageComponent,
    NgClass,
    AsyncPipe
  ],
  providers: [BaseListService],
  styleUrls: ['./calendar-event-page.component.css']
})
export class CalendarEventPageComponent implements OnInit, OnDestroy {
  private readonly selectedDateSignal = signal<Date>(new Date());
  private readonly sessionsSignal = signal<CalendarSessionData[]>([]);
  private readonly tracksSignal = signal<string[]>([]);
  private readonly calendarDataSignal = signal<CalendarDayData | null>(null);
  private readonly eventDateRangeSignal = signal<{ start: Date; end: Date } | null>(null);

  readonly selectedDate = computed(() => this.selectedDateSignal());
  readonly sessions = computed(() => this.sessionsSignal());
  readonly tracks = computed(() => this.tracksSignal());
  readonly calendarData = computed(() => this.calendarDataSignal());
  readonly eventDateRange = computed(() => this.eventDateRangeSignal());

  readonly HOUR_HEIGHT: number = 120;
  readonly START_HOUR: number = 9;
  readonly END_HOUR: number = 19;

  readonly listService = inject(BaseListService<CalendarSessionData>);
  readonly state$: Observable<ListState> = this.listService.state$;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly calendarService = inject(CalendarService);

  constructor(
    eventService: EventService,
    eventDataService: EventDataService
  ) {
    (this.listService as any).eventService = eventService;
    (this.listService as any).eventDataService = eventDataService;
  }

  ngOnInit(): void {
    this.initializeRouteSubscription();
  }

  ngOnDestroy(): void {
    this.listService.destroy();
  }

  private initializeRouteSubscription(): void {
    this.listService.initializeRouteSubscription(
      this.route,
      () => this.loadItems()
    );
  }

  private async loadItems(): Promise<void> {
    const currentState = this.listService.getCurrentState();
    if (!currentState.eventId) return;

    this.listService.updateState({ isLoadingItems: true });

    return new Promise((resolve, reject) => {
      forkJoin({
        sessions: this.calendarService.getCalendarSessions(currentState.eventId),
        tracks: this.calendarService.getEventTracks(currentState.eventId)
      }).pipe(
        finalize(() => this.listService.updateState({ isLoadingItems: false })),
        takeUntilDestroyed(this.listService['destroyRef'])
      ).subscribe({
        next: ({ sessions, tracks }) => {
          this.sessionsSignal.set(sessions || []);
          this.tracksSignal.set(tracks || []);

          this.listService.updateItems(this.sessions());

          const dateRange = this.calendarService.getEventDateRange(this.sessions());
          this.eventDateRangeSignal.set(dateRange);

          if (dateRange) {
            this.selectedDateSignal.set(new Date(dateRange.start));
          }

          this.buildCalendarData();
          resolve();
        },
        error: (err) => {
          console.error('Error loading calendar data:', err);
          this.listService.updateState({ error: 'Failed to load calendar data' });
          reject(err);
        }
      });
    });
  }

  get isLoading(): boolean {
    return this.listService.getCurrentState().isLoading;
  }

  get isLoadingItems(): boolean {
    return this.listService.getCurrentState().isLoadingItems;
  }

  get error(): string | null {
    return this.listService.getCurrentState().error;
  }

  get eventName(): string {
    return this.listService.getCurrentState().eventName;
  }

  get eventUrl(): string {
    return this.listService.getCurrentState().eventUrl;
  }

  get eventId(): string {
    return this.listService.getCurrentState().eventId;
  }

  get teamId(): string {
    return this.listService.getCurrentState().teamId;
  }

  openItemDetail(itemId: string): void {
    const currentState = this.listService.getCurrentState();
    this.router.navigate(['/event', currentState.eventId, 'session', itemId]);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.listService.onSearch(target.value);
    this.filterItems();
  }

  private filterItems(): void {
    const searchTerm = this.listService.getCurrentState().searchTerm;

    if (!searchTerm) {
      this.listService.updateFilteredItems(this.sessions());
    } else {
      const filtered = this.sessions().filter(session =>
        session.title.toLowerCase().includes(searchTerm) ||
        (session.abstractText && session.abstractText.toLowerCase().includes(searchTerm)) ||
        (session.speakers && session.speakers.some(speaker =>
          speaker.name.toLowerCase().includes(searchTerm)
        ))
      );
      this.listService.updateFilteredItems(filtered);
    }

    this.buildCalendarData();
  }

  private buildCalendarData(): void {
    const filteredItems = this.listService.getCurrentFilteredItems();
    const calendarData = this.calendarService.buildCalendarData(
      filteredItems,
      this.selectedDate(),
      this.tracks()
    );
    this.calendarDataSignal.set(calendarData);
  }

  goToPreviousDay(): void {
    const previousDay = new Date(this.selectedDate());
    previousDay.setDate(previousDay.getDate() - 1);
    this.selectedDateSignal.set(previousDay);
    this.buildCalendarData();
  }

  goToNextDay(): void {
    const nextDay = new Date(this.selectedDate());
    nextDay.setDate(nextDay.getDate() + 1);
    this.selectedDateSignal.set(nextDay);
    this.buildCalendarData();
  }

  goToEventStart(): void {
    const dateRange = this.eventDateRange();
    if (dateRange) {
      this.selectedDateSignal.set(new Date(dateRange.start));
      this.buildCalendarData();
    }
  }

  onSessionClick(session: CalendarSessionData): void {
    this.openItemDetail(session.id);
  }

  readonly displayHours = computed((): string[] => {
    const hours: string[] = [];
    for (let hour: number = this.START_HOUR; hour <= this.END_HOUR; hour++) {
      hours.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return hours;
  });

  formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-EN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }

  formatSessionTime(session: CalendarSession): string {
    const start: string = session.startTime.toLocaleTimeString('en-EN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const end: string = session.endTime.toLocaleTimeString('en-EN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${start} - ${end}`;
  }

  getSpeakerNames(session: CalendarSessionData): string {
    if (!session.speakers || session.speakers.length === 0) {
      return '';
    }
    return session.speakers.map(speaker => speaker.name).join(', ');
  }

  getSessionCssClass(session: CalendarSessionData): string {
    const baseClass = 'calendar-session';

    if (session.categories && session.categories.length > 0) {
      const category: string = session.categories[0].name.toLowerCase().replace(/\s+/g, '-');
      return `${baseClass} ${baseClass}--${category}`;
    }

    return baseClass;
  }

  readonly canGoToPreviousDay = computed((): boolean => {
    const dateRange = this.eventDateRange();
    if (!dateRange) return true;

    const previousDay = new Date(this.selectedDate());
    previousDay.setDate(previousDay.getDate() - 1);
    return previousDay >= dateRange.start;
  });

  readonly canGoToNextDay = computed((): boolean => {
    const dateRange = this.eventDateRange();
    if (!dateRange) return true;

    const nextDay = new Date(this.selectedDate());
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay <= dateRange.end;
  });
}
