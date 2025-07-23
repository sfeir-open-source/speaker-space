import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../../../environments/environment.development';
import {CalendarDayData, CalendarSession, CalendarSessionData, TrackColumn} from '../../type/calendar/calendar';
import {DateTimeService} from '../sessions/date-time.service';

const HOUR_HEIGHT : number = 120;

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  constructor(
    private http: HttpClient,
    private dateTimeService: DateTimeService
  ) {}

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
    tracks: string[],
    eventTimeZone: string = 'Europe/Paris'
  ): CalendarDayData {
    const sessionsForDay = this.getSessionsForDate(sessions, selectedDate, eventTimeZone);

    const trackColumns: TrackColumn[] = tracks.map(track => ({
      name: track,
      sessions: this.getCalendarSessionsForTrack(sessionsForDay, track, eventTimeZone)
    }));

    return {
      date: selectedDate,
      tracks: trackColumns
    };
  }

  private getSessionsForDate(
    sessions: CalendarSessionData[],
    date: Date,
    eventTimeZone: string
  ): CalendarSessionData[] {
    const targetDateStr = this.formatDateInTimeZone(date, eventTimeZone);

    return sessions.filter(session => {
      if (!session.start) return false;

      try {
        const sessionDate = new Date(session.start);
        const sessionDateStr = this.formatDateInTimeZone(sessionDate, eventTimeZone);
        return sessionDateStr === targetDateStr;
      } catch (error) {
        console.warn('Error parsing session date:', session.start, error);
        return false;
      }
    });
  }

  private getCalendarSessionsForTrack(
    sessions: CalendarSessionData[],
    track: string,
    eventTimeZone: string
  ): CalendarSession[] {
    const trackSessions = sessions.filter(session =>
      (session.track || 'Main Track') === track &&
      session.start &&
      session.end
    );

    return trackSessions.map(session => {
      try {
        const startTime = new Date(session.start);
        const endTime = new Date(session.end);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.warn('Invalid dates for session:', session.id, session.start, session.end);
          return null;
        }

        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

        return {
          session,
          startTime,
          endTime,
          duration,
          track,
          topPosition: this.calculateTopPosition(startTime, eventTimeZone),
          height: this.calculateHeight(duration)
        };
      } catch (error) {
        console.error('Error processing session for calendar:', session.id, error);
        return null;
      }
    })
      .filter((session): session is CalendarSession => session !== null)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  private calculateTopPosition(startTime: Date, eventTimeZone: string, startHour: number = 9): number {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: eventTimeZone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });

      const parts = formatter.formatToParts(startTime);
      const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0');

      const totalMinutes = (hours - startHour) * 60 + minutes;
      return Math.max(0, (totalMinutes / 60) * 120); // 120 = HOUR_HEIGHT
    } catch (error) {
      console.warn('Error calculating position for time:', startTime, error);
      const hours = startTime.getHours();
      const minutes = startTime.getMinutes();
      const totalMinutes = (hours - startHour) * 60 + minutes;
      return Math.max(0, (totalMinutes / 60) * 120);
    }
  }

  private calculateHeight(durationMinutes: number): number {
    return Math.max((durationMinutes / 60) * 120, 30); // Hauteur minimum de 30px
  }

  private formatDateInTimeZone(date: Date, eventTimeZone: string): string {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: eventTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch (error) {
      console.warn('Error formatting date in timezone:', error);
      return date.toISOString().split('T')[0];
    }
  }

  formatSessionTime(session: CalendarSession, eventTimeZone: string): string {
    const start = this.dateTimeService.formatTimeForEvent(session.startTime, eventTimeZone);
    const end = this.dateTimeService.formatTimeForEvent(session.endTime, eventTimeZone);
    return `${start} - ${end}`;
  }

  getEventDateRange(sessions: CalendarSessionData[]): { start: Date; end: Date } | null {
    if (!sessions || sessions.length === 0) return null;

    const validDates = sessions
      .map(session => session.start)
      .filter(date => date && !isNaN(new Date(date).getTime()))
      .map(date => new Date(date));

    if (validDates.length === 0) return null;

    const startDate = new Date(Math.min(...validDates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...validDates.map(d => d.getTime())));

    return { start: startDate, end: endDate };
  }
}
