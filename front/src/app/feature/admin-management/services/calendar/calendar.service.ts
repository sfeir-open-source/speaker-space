import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  parseISO,
  isSameDay,
  differenceInMinutes,
  getHours,
  getMinutes,
  isValid,
  min,
  max
} from 'date-fns';
import { environment } from '../../../../../environments/environment.development';
import {
  CalendarDayData,
  CalendarSession,
  CalendarSessionData,
  TrackColumn
} from '../../type/calendar/calendar';

const HOUR_HEIGHT = 120 as const;
const DEFAULT_START_HOUR = 9 as const;
const MIN_SESSION_HEIGHT = 30 as const;

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  constructor(private readonly http: HttpClient) {}

  getCalendarSessions(eventId: string): Observable<CalendarSessionData[]> {
    return this.http.get<CalendarSessionData[]>(
      `${environment.apiUrl}/session/event/${eventId}/calendar`,
      { withCredentials: true }
    );
  }

  getEventTracks(eventId: string): Observable<string[]> {
    return this.http.get<string[]>(
      `${environment.apiUrl}/session/event/${eventId}/tracks`,
      { withCredentials: true }
    );
  }

  buildCalendarData(
    sessions: CalendarSessionData[],
    selectedDate: Date,
    tracks: string[]
  ): CalendarDayData {
    const sessionsForDay = this.getSessionsForDate(sessions, selectedDate);

    const trackColumns: TrackColumn[] = tracks.map(track => ({
      name: track,
      sessions: this.getCalendarSessionsForTrack(sessionsForDay, track)
    }));

    return {
      date: selectedDate,
      tracks: trackColumns
    };
  }

  private getSessionsForDate(sessions: CalendarSessionData[], date: Date): CalendarSessionData[] {
    return sessions.filter(session => {
      if (!session.start) return false;

      const sessionDate = this.parseSessionDate(session.start);
      return sessionDate ? isSameDay(sessionDate, date) : false;
    });
  }

  private getCalendarSessionsForTrack(
    sessions: CalendarSessionData[],
    track: string,
  ): CalendarSession[] {
    const trackSessions = sessions.filter(session =>
      (session.track || 'Main Track') === track &&
      session.start &&
      session.end
    );

    return trackSessions
      .map(session => this.createCalendarSession(session, track))
      .filter((session): session is CalendarSession => session !== null)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  private createCalendarSession(
    session: CalendarSessionData,
    track: string
  ): CalendarSession | null {
    const startTime = this.parseSessionDate(session.start);
    const endTime = this.parseSessionDate(session.end);

    if (!startTime || !endTime) {
      console.warn('Session avec dates invalides ignorée:', session);
      return null;
    }

    const duration : number = differenceInMinutes(endTime, startTime);

    return {
      session,
      startTime,
      endTime,
      duration,
      track,
      topPosition: this.calculateTopPosition(startTime),
      height: this.calculateHeight(duration)
    };
  }

  private calculateTopPosition(
    startTime: Date,
    startHour: number = DEFAULT_START_HOUR
  ): number {
    const hours : number = getHours(startTime);
    const minutes : number = getMinutes(startTime);
    const totalMinutes : number = (hours - startHour) * 60 + minutes;
    return (totalMinutes / 60) * HOUR_HEIGHT;
  }

  private calculateHeight(durationMinutes: number): number {
    return Math.max((durationMinutes / 60) * HOUR_HEIGHT, MIN_SESSION_HEIGHT);
  }

  private parseSessionDate(dateInput: string | Date | undefined): Date | null {
    if (!dateInput) return null;

    try {
      if (dateInput instanceof Date) {
        return isValid(dateInput) ? dateInput : null;
      }

      if (typeof dateInput === 'string') {
        const parsed = parseISO(dateInput);
        return isValid(parsed) ? parsed : null;
      }

      return null;
    } catch {
      return null;
    }
  }

  getEventDateRange(sessions: CalendarSessionData[]): { start: Date; end: Date } | null {
    const validDates = sessions
      .map(s => this.parseSessionDate(s.start))
      .filter((date): date is Date => date !== null);

    if (validDates.length === 0) return null;

    return {
      start: min(validDates),
      end: max(validDates)
    };
  }
}
