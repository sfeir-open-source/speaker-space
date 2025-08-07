import { Injectable } from '@angular/core';

export interface SessionScheduleFormatOptions {
  includeHtml?: boolean;
  includeYear?: boolean;
  timeFormat?: '12h' | '24h';
  trackPrefix?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionFormatService {

  formatSessionDateTime(date: Date, options: SessionScheduleFormatOptions = {}): string {
    if (!date || isNaN(date.getTime())) {
      return 'Date not available';
    }

    const {
      includeHtml = false,
      includeYear = true,
      timeFormat = '24h'
    } = options;

    try {
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        ...(includeYear && { year: 'numeric' })
      };

      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: timeFormat === '12h'
      };

      const dateStr : string = date.toLocaleDateString('en-US', dateOptions);
      const timeStr : string = date.toLocaleTimeString('en-US', timeOptions);

      if (includeHtml) {
        return `<strong class="font-medium">${dateStr}</strong> at <strong class="font-medium">${timeStr}</strong>`;
      }

      return `${dateStr} at ${timeStr}`;
    } catch (error) {
      console.warn('Error formatting session date:', error);
      return 'Date formatting error';
    }
  }

  formatTrackName(track: string): string {
    if (!track) return '';

    if (track.includes(' ')) {
      return track;
    }

    return track
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  formatCompleteScheduleInfo(
    startDate: Date | undefined,
    track: string | undefined,
    options: SessionScheduleFormatOptions = {}
  ): string {
    const {
      includeHtml = false,
      trackPrefix = 'in room'
    } = options;

    if (!startDate && !track) {
      return 'Schedule not yet available';
    }

    const parts: string[] = [];

    if (startDate) {
      const dateTimeStr : string = this.formatSessionDateTime(startDate, options);
      parts.push(dateTimeStr);
    }

    if (track) {
      const trackName : string = this.formatTrackName(track);
      const trackStr : string = includeHtml
        ? `${trackPrefix} <strong class="font-medium">${trackName}</strong>`
        : `${trackPrefix} '${trackName}'`;
      parts.push(trackStr);
    }

    return parts.join(' ') || 'Schedule information incomplete';
  }

  formatDateForInput(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  }

  formatTimeForInput(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    return date.toTimeString().slice(0, 5);
  }

  formatLevel(level: string): string {
    if (!level) return '';
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  }

  formatLanguage(languageCode: string): string {
    if (!languageCode) return '';

    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
      const languageName = displayNames.of(languageCode.toLowerCase());

      return languageName
        ? languageName.charAt(0).toUpperCase() + languageName.slice(1)
        : languageCode.toUpperCase();
    } catch (error) {
      console.warn(`Unable to format language code: ${languageCode}`, error);
      return languageCode.toUpperCase();
    }
  }
}
