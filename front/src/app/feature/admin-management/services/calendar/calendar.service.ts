import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../../../environments/environment.development';
import {CalendarDayData, CalendarSession, CalendarSessionData, TrackColumn} from '../../type/calendar/calendar';

const HOUR_HEIGHT : number = 120;

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  constructor(private http: HttpClient) {}

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
    const targetDate : string = this.formatDateOnly(date);

    return sessions.filter(session => {
      if (!session.start) return false;
      const sessionDate : string = this.formatDateOnly(new Date(session.start));
      return sessionDate === targetDate;
    });
  }

  private getCalendarSessionsForTrack(
    sessions: CalendarSessionData[],
    track: string
  ): CalendarSession[] {
    const trackSessions = sessions.filter(session =>
      (session.track || 'Main Track') === track &&
      session.start &&
      session.end
    );

    return trackSessions.map(session => {
      const startTime = new Date(session.start);
      const endTime = new Date(session.end);
      const duration: number = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

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

  private calculateTopPosition(startTime: Date, startHour: number = 8): number {
    const hours : number = startTime.getHours();
    const minutes: number = startTime.getMinutes();
    const totalMinutes: number = (hours - startHour) * 60 + minutes;
    return (totalMinutes / 60) * HOUR_HEIGHT;
  }

  private calculateHeight(durationMinutes: number): number {
    return Math.max((durationMinutes / 60) * HOUR_HEIGHT, 30);
  }

  private formatDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getEventDateRange(sessions: CalendarSessionData[]): { start: Date; end: Date } | null {
    if (!sessions.length) return null;

    const dates = sessions
      .filter(s => s.start)
      .map(s => new Date(s.start))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      start: dates[0],
      end: dates[dates.length - 1]
    };
  }
}
