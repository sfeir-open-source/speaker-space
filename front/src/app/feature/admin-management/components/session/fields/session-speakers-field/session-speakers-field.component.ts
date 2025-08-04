import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Speaker} from '../../../../type/session/session';

@Component({
  selector: 'app-session-speakers-field',
  imports: [
    FormsModule
  ],
  templateUrl: './session-speakers-field.component.html',
  styleUrl: './session-speakers-field.component.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class SessionSpeakersFieldComponent {
  @Input() selectedSpeakers: Speaker[] = [];
  @Input() availableSpeakers: Speaker[] = [];
  @Input() isLoading: boolean = false;
  @Output() speakersChange = new EventEmitter<Speaker[]>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchTerm: string = '';
  showDropdown: boolean = false;
  filteredSpeakers: Speaker[] = [];
  highlightedIndex: number = -1;
  private blurTimeout?: number;

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.filterSpeakers();
    this.showDropdown = true;
    this.highlightedIndex = -1;
  }

  private filterSpeakers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredSpeakers = this.availableSpeakers.filter(speaker =>
        !this.isSpeakerSelected(speaker)
      );
    } else {
      const searchTerm = this.searchTerm.toLowerCase();
      this.filteredSpeakers = this.availableSpeakers.filter(speaker =>
        !this.isSpeakerSelected(speaker) &&
        (speaker.name.toLowerCase().includes(searchTerm) ||
          speaker.company?.toLowerCase().includes(searchTerm))
      );
    }
  }

  focusSearch(): void {
    this.showDropdown = true;
    this.filterSpeakers();
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    }, 0);
  }

  selectSpeaker(speaker: Speaker): void {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
      this.blurTimeout = undefined;
    }

    if (!this.isSpeakerSelected(speaker)) {
      const updatedSpeakers = [...this.selectedSpeakers, speaker];
      this.speakersChange.emit(updatedSpeakers);
    }

    this.searchTerm = '';
    this.filterSpeakers();
    this.showDropdown = false;
    this.highlightedIndex = -1;
  }

  removeSpeaker(speaker: Speaker): void {
    const updatedSpeakers = this.selectedSpeakers.filter(s => s.id !== speaker.id);
    this.speakersChange.emit(updatedSpeakers);
    this.filterSpeakers();
  }

  isSpeakerSelected(speaker: Speaker): boolean {
    return this.selectedSpeakers.some(s => s.id === speaker.id);
  }

  onInputBlur(): void {
    this.blurTimeout = window.setTimeout(() => {
      this.showDropdown = false;
      this.highlightedIndex = -1;
    }, 150);
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.showDropdown || this.filteredSpeakers.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredSpeakers.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredSpeakers.length) {
          this.selectSpeaker(this.filteredSpeakers[this.highlightedIndex]);
        }
        break;
      case 'Escape':
        this.showDropdown = false;
        this.highlightedIndex = -1;
        break;
    }
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const container = target.closest('[data-speaker-multiselect]');
    if (!container && this.showDropdown) {
      this.showDropdown = false;
      this.highlightedIndex = -1;
    }
  }
}
