import {
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Speaker } from '../../../../type/session/session';
import {IconAlertComponent} from '../../../../../../shared/icon-alert/icon-alert.component';
import {IconName} from '../../../../../../shared/icon-alert/service/icon.service';

@Component({
  selector: 'app-session-speakers-field',
  imports: [FormsModule, IconAlertComponent],
  templateUrl: './session-speakers-field.component.html',
  styleUrl: './session-speakers-field.component.scss',
  standalone: true,
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class SessionSpeakersFieldComponent {
  selectedSpeakers = input<Speaker[]>([]);
  availableSpeakers = input<Speaker[]>([]);
  isLoading = input<boolean>(false);
  isSubmitted = input<boolean>(false);
  required = input(true, { transform: booleanAttribute });

  protected readonly IconName = IconName;
  speakersChange = output<Speaker[]>();

  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  searchTerm = signal('');
  showDropdown = signal(false);
  highlightedIndex = signal(-1);
  private blurTimeout?: number;

  filteredSpeakers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const available = this.availableSpeakers();
    const selected = this.selectedSpeakers();

    const notSelected = available.filter(speaker =>
      !selected.some(s => s.id === speaker.id)
    );

    if (!term) {
      return notSelected;
    }

    return notSelected.filter(speaker =>
      speaker.name.toLowerCase().includes(term) ||
      speaker.company?.toLowerCase().includes(term)
    );
  });

  hasError = computed(() => {
    return this.required() &&
      this.isSubmitted() &&
      this.selectedSpeakers().length === 0;
  });

  searchPlaceholder = computed(() =>
    this.selectedSpeakers().length === 0
      ? 'Search and select speakers...'
      : 'Add more speakers...'
  );

  constructor() {
    effect(() => {
      const count = this.filteredSpeakers().length;
      if (this.highlightedIndex() >= count) {
        this.highlightedIndex.set(-1);
      }
    });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.showDropdown.set(true);
    this.highlightedIndex.set(-1);
  }

  focusSearch(): void {
    this.showDropdown.set(true);

    setTimeout(() => {
      const input = this.searchInput();
      input?.nativeElement.focus();
    }, 0);
  }

  selectSpeaker(speaker: Speaker): void {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
      this.blurTimeout = undefined;
    }

    if (!this.isSpeakerSelected(speaker)) {
      const updatedSpeakers = [...this.selectedSpeakers(), speaker];
      this.speakersChange.emit(updatedSpeakers);
    }

    this.searchTerm.set('');
    this.showDropdown.set(false);
    this.highlightedIndex.set(-1);
  }

  removeSpeaker(speaker: Speaker): void {
    const updatedSpeakers = this.selectedSpeakers().filter(s => s.id !== speaker.id);
    this.speakersChange.emit(updatedSpeakers);
  }

  isSpeakerSelected(speaker: Speaker): boolean {
    return this.selectedSpeakers().some(s => s.id === speaker.id);
  }

  onInputBlur(): void {
    this.blurTimeout = window.setTimeout(() => {
      this.showDropdown.set(false);
      this.highlightedIndex.set(-1);
    }, 150);
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.showDropdown() || this.filteredSpeakers().length === 0) return;

    const maxIndex = this.filteredSpeakers().length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update(index => Math.min(index + 1, maxIndex));
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update(index => Math.max(index - 1, -1));
        break;

      case 'Enter':
        event.preventDefault();
        const index = this.highlightedIndex();
        if (index >= 0 && index < this.filteredSpeakers().length) {
          this.selectSpeaker(this.filteredSpeakers()[index]);
        }
        break;

      case 'Escape':
        this.showDropdown.set(false);
        this.highlightedIndex.set(-1);
        break;
    }
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const container = target.closest('[data-speaker-multiselect]');

    if (!container && this.showDropdown()) {
      this.showDropdown.set(false);
      this.highlightedIndex.set(-1);
    }
  }
}
