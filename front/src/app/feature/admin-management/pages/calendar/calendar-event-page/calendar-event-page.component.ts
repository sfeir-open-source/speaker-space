import {Component, OnInit, OnDestroy} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {BaseListComponent} from '../../../components/class/base-list-component';
import {CalendarService} from '../../../services/calendar/calendar.service';
import {EventService} from '../../../services/event/event.service';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {EventDataService} from '../../../services/event/event-data.service';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {NgClass} from '@angular/common';
import {CalendarDayData, CalendarSession, CalendarSessionData} from '../../../type/calendar/calendar';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {DateTimeService} from '../../../services/sessions/date-time.service';
import {EventDTO} from '../../../type/event/eventDTO';

@Component({
  selector: 'app-calendar-event-page',
  templateUrl: './calendar-event-page.component.html',
  imports: [
    NavbarEventPageComponent,
    NgClass
  ],
  styleUrls: ['./calendar-event-page.component.css']
})
export class CalendarEventPageComponent extends BaseListComponent<CalendarSessionData> implements OnInit, OnDestroy {

  selectedDate: Date = new Date();
  sessions: CalendarSessionData[] = [];
  tracks: string[] = [];
  calendarData: CalendarDayData | null = null;
  eventDateRange: { start: Date; end: Date } | null = null;

  private event: EventDTO | null = null;

  readonly HOUR_HEIGHT: number = 120;
  readonly START_HOUR: number = 9;
  readonly END_HOUR: number = 20;

  constructor(
    route: ActivatedRoute,
    router: Router,
    eventService: EventService,
    speakerService: SpeakerService,
    eventDataService: EventDataService,
    private calendarService: CalendarService,
    private dateTimeService: DateTimeService
  ) {
    super(route, router, eventService, speakerService, eventDataService);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadEventData();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected override loadEventData(): void {
    if (!this.eventId) {
      this.error = 'Event ID is required to load event data';
      this.isLoading = false;
      return;
    }

    this.eventService.getEventById(this.eventId)
      .pipe(
        finalize(() => this.isLoading = false),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe({
        next: (event: EventDTO) => {
          this.handleEventDataLoaded(event);
          this.eventDataService.loadEvent({
            idEvent: event.idEvent || this.eventId,
            eventName: event.eventName || '',
            teamId: event.teamId || '',
            url: event.url || '',
            teamUrl: event.teamUrl,
            type: event.type,
          });

          this.event = event;
          this.loadItems();
        },
        error: (err) => {
          console.error('Error loading event:', err);
          this.error = 'Failed to load event data';
        }
      });
  }

  override loadItems(): void {
    if (!this.eventId) return;

    this.isLoadingItems = true;

    forkJoin({
      sessions: this.calendarService.getCalendarSessions(this.eventId),
      tracks: this.calendarService.getEventTracks(this.eventId)
    }).pipe(
      finalize(() => this.isLoadingItems = false),
      takeUntilDestroyed(this._destroyRef),
    ).subscribe({
      next: ({sessions, tracks}) => {
        this.sessions = sessions || [];
        this.tracks = tracks || [];
        this.items = this.sessions;
        this.filteredItems = this.sessions;
        this.totalItems = this.sessions.length;

        this.eventDateRange = this.calendarService.getEventDateRange(this.sessions);
        if (this.eventDateRange) {
          this.selectedDate = new Date(this.eventDateRange.start);
        }

        this.buildCalendarData();
      },
      error: (err) => {
        console.error('Error loading calendar data:', err);
        this.error = 'Failed to load calendar data';
      }
    });
  }

  override getItemId(item: CalendarSessionData): string {
    return item.id || '';
  }

  override filterItems(): void {
    if (!this.searchTerm) {
      this.filteredItems = this.sessions;
    } else {
      this.filteredItems = this.sessions.filter(session =>
        session.title.toLowerCase().includes(this.searchTerm) ||
        (session.abstractText && session.abstractText.toLowerCase().includes(this.searchTerm)) ||
        (session.speakers && session.speakers.some(speaker =>
          speaker.name.toLowerCase().includes(this.searchTerm)
        ))
      );
    }
    this.updateItemsAfterFilter();
    this.buildCalendarData();
  }

  override openItemDetail(itemId: string): void {
    this.router.navigate(['/event', this.eventId, 'session', itemId]);
  }

  private buildCalendarData(): void {
    if (!this.event) return;

    const eventTimeZone = this.event.timeZone || 'Europe/Paris';
    this.calendarData = this.calendarService.buildCalendarData(
      this.filteredItems,
      this.selectedDate,
      this.tracks,
      eventTimeZone
    );
  }

  goToPreviousDay(): void {
    const previousDay = new Date(this.selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    this.selectedDate = previousDay;
    this.buildCalendarData();
  }

  goToNextDay(): void {
    const nextDay = new Date(this.selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    this.selectedDate = nextDay;
    this.buildCalendarData();
  }

  goToEventStart(): void {
    if (this.eventDateRange) {
      this.selectedDate = new Date(this.eventDateRange.start);
      this.buildCalendarData();
    }
  }

  onSessionClick(session: CalendarSessionData): void {
    this.openItemDetail(session.id);
  }

  get displayHours(): string[] {
    const hours: string[] = [];
    for (let hour: number = this.START_HOUR; hour <= this.END_HOUR; hour++) {
      hours.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return hours;
  }

  formatDisplayDate(date: Date): string {
    if (!this.event) return date.toLocaleDateString();

    const eventTimeZone = this.event.timeZone || 'Europe/Paris';
    return this.dateTimeService.formatDateTimeForEvent(date, eventTimeZone, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }

  formatSessionTime(session: CalendarSession): string {
    if (!this.event) {
      return `${session.startTime.toLocaleTimeString()} - ${session.endTime.toLocaleTimeString()}`;
    }

    const eventTimeZone = this.event.timeZone || 'Europe/Paris';
    return this.calendarService.formatSessionTime(session, eventTimeZone);
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

  canGoToPreviousDay(): boolean {
    if (!this.eventDateRange) return true;
    const previousDay = new Date(this.selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    return previousDay >= this.eventDateRange.start;
  }

  canGoToNextDay(): boolean {
    if (!this.eventDateRange) return true;
    const nextDay = new Date(this.selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay <= this.eventDateRange.end;
  }
}
