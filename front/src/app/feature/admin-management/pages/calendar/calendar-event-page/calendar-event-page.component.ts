import {Component, OnDestroy, OnInit} from '@angular/core';
import {NavbarEventPageComponent} from "../../../components/event/navbar-event-page/navbar-event-page.component";
import {BaseListComponent} from '../../../components/class/base-list-component';
import {SessionImportData} from '../../../type/session/session';
import {finalize, takeUntil} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {SessionService} from '../../../services/sessions/session.service';
import {EventService} from '../../../services/event/event.service';
import {NgClass} from '@angular/common';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {EventDataService} from '../../../services/event/event-data.service';

interface CalendarSession {
  session: SessionImportData;
  startTime: Date;
  endTime: Date;
  duration: number;
  track: string;
  topPosition: number;
  height: number;
}

interface TrackColumn {
  name: string;
  sessions: CalendarSession[];
}

@Component({
  selector: 'app-calendar-event-page',
  imports: [
    NavbarEventPageComponent,
    NgClass
  ],
  templateUrl: './calendar-event-page.component.html',
  styleUrl: './calendar-event-page.component.scss'
})
export class CalendarEventPageComponent extends BaseListComponent<SessionImportData> implements OnInit, OnDestroy {

  event: Event | null = null;
  selectedDate: Date = new Date();
  sessions: SessionImportData[] = [];
  trackColumns: TrackColumn[] = [];

  readonly HOUR_HEIGHT = 60;
  readonly START_HOUR = 8;
  readonly END_HOUR = 20;

  private sessionService: SessionService;

  constructor(
    route: ActivatedRoute,
    router: Router,
    eventService: EventService,
    speakerService: SpeakerService,
    eventDataService: EventDataService,
    sessionService: SessionService
  ) {
    super(route, router, eventService, speakerService, eventDataService);
    this.sessionService = sessionService;
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  override loadItems(): void {
    if (!this.eventId) return;

    this.isLoadingItems = true;
    this.sessionService.getSessionsByEventId(this.eventId)
      .pipe(
        finalize(() => this.isLoadingItems = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (sessions: SessionImportData[]) => {
          this.sessions = sessions || [];
          this.items = this.sessions;
          this.filteredItems = this.sessions;
          this.totalItems = this.sessions.length;
          this.buildCalendarData();
        },
        error: (err) => {
          console.error('Error loading sessions:', err);
          this.error = 'Failed to load sessions';
        }
      });
  }

  override getItemId(item: SessionImportData): string {
    return item.id || '';
  }

  override filterItems(): void {
    if (!this.searchTerm) {
      this.filteredItems = this.sessions;
    } else {
      this.filteredItems = this.sessions.filter(session =>
        session.title.toLowerCase().includes(this.searchTerm) ||
        session.abstractText.toLowerCase().includes(this.searchTerm) ||
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
    const sessionsForDay = this.getSessionsForDate(this.selectedDate);
    const tracks = this.getUniqueTracksFromSessions(sessionsForDay);

    this.trackColumns = tracks.map(track => ({
      name: track,
      sessions: this.getCalendarSessionsForTrack(sessionsForDay, track)
    }));
  }

  private getSessionsForDate(date: Date): SessionImportData[] {
    const targetDate = this.formatDateOnly(date);

    return this.filteredItems.filter(session => {
      if (!session.start) return false;

      const sessionDate = this.formatDateOnly(new Date(session.start));
      return sessionDate === targetDate;
    });
  }

  private getUniqueTracksFromSessions(sessions: SessionImportData[]): string[] {
    const tracks = new Set<string>();

    sessions.forEach(session => {
      const track = session.track || 'No Track';
      tracks.add(track);
    });

    return Array.from(tracks).sort();
  }

  private getCalendarSessionsForTrack(sessions: SessionImportData[], track: string): CalendarSession[] {
    const trackSessions = sessions.filter(session =>
      (session.track || 'No Track') === track &&
      session.start &&
      session.end
    );

    return trackSessions.map(session => {
      const startTime = new Date(session.start!);
      const endTime = new Date(session.end!);
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      return {
        session,
        startTime,
        endTime,
        duration,
        track,
        topPosition: this.calculateTopPosition(startTime),
        height: this.calculateHeight(duration)
      };
    }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  private calculateTopPosition(startTime: Date): number {
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    const totalMinutes = (hours - this.START_HOUR) * 60 + minutes;
    return (totalMinutes / 60) * this.HOUR_HEIGHT;
  }

  private calculateHeight(durationMinutes: number): number {
    return Math.max((durationMinutes / 60) * this.HOUR_HEIGHT, 30);
  }

  private formatDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  get displayHours(): string[] {
    const hours: string[] = [];
    for (let hour = this.START_HOUR; hour <= this.END_HOUR; hour++) {
      hours.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return hours;
  }

  onDateChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedDate = new Date(target.value);
    this.buildCalendarData();
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

  goToToday(): void {
    this.selectedDate = new Date();
    this.buildCalendarData();
  }

  formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatInputDate(date: Date): string {
    return this.formatDateOnly(date);
  }

  formatSessionTime(session: CalendarSession): string {
    const start = session.startTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const end = session.endTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${start} - ${end}`;
  }

  onSessionClick(session: SessionImportData): void {
    this.openItemDetail(session.id || '');
  }

  getSessionCssClass(session: SessionImportData): string {
    const baseClass = 'calendar-session';

    if (session.categories && session.categories.length > 0) {
      const category = session.categories[0].name.toLowerCase().replace(/\s+/g, '-');
      return `${baseClass} ${baseClass}--${category}`;
    }

    return baseClass;
  }

  getSpeakerNames(session: SessionImportData): string {
    if (!session.speakers || session.speakers.length === 0) {
      return '';
    }
    return session.speakers.map(speaker => speaker.name).join(', ');
  }
}
