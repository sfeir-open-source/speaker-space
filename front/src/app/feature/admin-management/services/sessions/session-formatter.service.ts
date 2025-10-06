import { Injectable } from '@angular/core';
import {SessionImportData, Speaker} from '../../type/session/session';

@Injectable({ providedIn: 'root' })
export class SessionFormatterService {

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

  formatTrackName(track: string): string {
    if (!track) return '';
    if (track.includes(' ')) return track;

    return track
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  formatCompleteSessionInfo(start?: Date, track?: string): string {
    const parts: string[] = [];

    if (start) {
      try {
        const dateStr = start.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        const timeStr = start.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        parts.push(`<strong class="font-medium">${dateStr}</strong> at <strong class="font-medium">${timeStr}</strong>`);
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }

    if (track) {
      const formattedTrack = this.formatTrackName(track);
      parts.push(`in room <strong class="font-medium">${formattedTrack}</strong>`);
    }

    return parts.join(' ');
  }

  formatSpeakers(speakers: Speaker[] | undefined): string {
    if (!speakers || speakers.length === 0) return 'Aucun speaker';

    return speakers
      .map(speaker => speaker.name)
      .filter(name => name)
      .join(', ');
  }

  sortByTitle(sessions: SessionImportData[]): SessionImportData[] {
    return sessions.sort((a, b) => {
      const titleA = a.title?.toLowerCase() || '';
      const titleB = b.title?.toLowerCase() || '';
      return titleA.localeCompare(titleB);
    });
  }

  getSessionId(session: SessionImportData): string {
    return session.id || '';
  }
}
