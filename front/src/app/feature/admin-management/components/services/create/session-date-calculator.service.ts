import { Injectable } from '@angular/core';

export interface SessionTimeResult {
  startDateTime: Date | null;
  endDateTime: Date | null;
}

@Injectable({ providedIn: 'root' })
export class SessionDateCalculatorService {

  calculateSessionTimes(
    startDate: string,
    startTime: string,
    durationMinutes: number
  ): SessionTimeResult {
    if (!startDate || !startTime || !durationMinutes) {
      return { startDateTime: null, endDateTime: null };
    }

    try {
      const startDateTime = new Date(`${startDate}T${startTime}:00`);

      if (isNaN(startDateTime.getTime())) {
        console.error('Invalid date/time format');
        return { startDateTime: null, endDateTime: null };
      }

      const endDateTime = new Date(
        startDateTime.getTime() + (durationMinutes * 60 * 1000)
      );

      return { startDateTime, endDateTime };
    } catch (error) {
      console.error('Error calculating session times:', error);
      return { startDateTime: null, endDateTime: null };
    }
  }

  formatDateForInput(date: Date): string {
    if (!date || isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }
}
