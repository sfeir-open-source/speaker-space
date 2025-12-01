import { Injectable } from '@angular/core';
import { Speaker } from '../../type/session/session';

@Injectable({ providedIn: 'root' })
export class SpeakerFormatterService {
  sortByName(speakers: Speaker[]): Speaker[] {
    return speakers.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });
  }

  getSpeakerId(speaker: Speaker): string {
    return speaker.email || '';
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/profil-picture.svg';
  }
}
