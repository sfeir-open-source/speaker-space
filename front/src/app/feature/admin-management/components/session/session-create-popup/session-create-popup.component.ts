import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import {SessionService} from '../../../services/sessions/session.service';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {Category, Format, Speaker} from '../../../type/session/session';
import {ButtonGreenActionsComponent} from '../../../../../shared/button-green-actions/button-green-actions.component';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';

@Component({
  selector: 'app-session-create-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ButtonGreenActionsComponent, ButtonGreyComponent],
  templateUrl: './session-create-popup.component.html',
  styleUrl: './session-create-popup.component.scss'
})
export class SessionCreatePopupComponent implements OnInit, OnDestroy {
  @Input() eventId!: string;
  @Input() availableFormats: Format[] = [];
  @Input() availableCategories: Category[] = [];
  @Input() availableTracks: string[] = [];
  @Input() eventStartDate?: Date;
  @Input() eventEndDate?: Date;

  @Output() sessionCreated = new EventEmitter<void>();
  @Output() popupClosed = new EventEmitter<void>();

  private fb : FormBuilder = inject(FormBuilder);
  private sessionService :SessionService = inject(SessionService);
  private speakerService : SpeakerService = inject(SpeakerService);
  private blurTimeout?: number;
  private documentClickListener?: (event: Event) => void;

  sessionForm!: FormGroup;
  isCreating: boolean = false;
  isLoadingSpeakers: boolean = false;
  errorMessage: string | null = null;
  selectedFormats: string[] = [];
  selectedCategories: string[] = [];
  selectedSpeakers: Speaker[] = [];
  selectedLanguages: string[] = [];
  availableSpeakers: Speaker[] = [];
  speakerSearchTerm: string = '';
  showSpeakerDropdown: boolean = false;
  filteredSpeakers: Speaker[] = [];
  highlightedSpeakerIndex: number = -1;

  showDurationDropdown: boolean = false;
  selectedDuration: number = 60;
  durations = [20, 30, 40, 45, 50, 60, 75, 90, 105, 110, 120, 130].map(val => {
    const hours: number = Math.floor(val / 60);
    const minutes: number = val % 60;
    let label: string = '';
    if (hours > 0) {
      label += `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      if (hours > 0) label += ' ';
      label += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return { label, value: val };
  });

  commonLanguages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ];

  @ViewChild('speakerSearchInput') speakerSearchInput!: ElementRef<HTMLInputElement>;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    const speakerContainer = target.closest('[data-speaker-multiselect]');
    if (!speakerContainer && this.showSpeakerDropdown) {
      this.showSpeakerDropdown = false;
      this.highlightedSpeakerIndex = -1;
    }

    const durationContainer = target.closest('[data-duration-dropdown]');
    if (!durationContainer && this.showDurationDropdown) {
      this.showDurationDropdown = false;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showSpeakerDropdown) {
      this.showSpeakerDropdown = false;
      this.highlightedSpeakerIndex = -1;
      event.preventDefault();
    }

    if (this.showDurationDropdown) {
      this.showDurationDropdown = false;
      event.preventDefault();
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadAvailableSpeakers();
    this.setDefaultStartDate();
    this.setupDocumentClickListener();
  }

  ngOnDestroy(): void {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
    }
    this.removeDocumentClickListener();
  }

  getEventStartDate(): string {
    if (this.eventStartDate) {
      return this.formatDateForInput(this.eventStartDate);
    }
    return '';
  }

  getEventEndDate(): string {
    if (this.eventEndDate) {
      return this.formatDateForInput(this.eventEndDate);
    }
    return '';
  }

  getEventDateRange(): string {
    if (this.eventStartDate && this.eventEndDate) {
      const startStr : string = this.eventStartDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const endStr : string = this.eventEndDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return `${startStr} - ${endStr}`;
    }
    return '';
  }

  onSpeakerInputBlur(): void {
    this.blurTimeout = window.setTimeout(() => {
      this.showSpeakerDropdown = false;
      this.highlightedSpeakerIndex = -1;
    }, 150);
  }

  private setupDocumentClickListener(): void {
    this.documentClickListener = (event: Event): void => {
      const target = event.target as HTMLElement;

      const speakerContainer = target.closest('[data-speaker-multiselect]');
      if (!speakerContainer && this.showSpeakerDropdown) {
        this.showSpeakerDropdown = false;
        this.highlightedSpeakerIndex = -1;
      }

      const durationContainer = target.closest('[data-duration-dropdown]');
      if (!durationContainer && this.showDurationDropdown) {
        this.showDurationDropdown = false;
      }
    };

    document.addEventListener('click', this.documentClickListener as EventListener, true);
  }

  private removeDocumentClickListener(): void {
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener as EventListener, true);
    }
  }

  selectSpeaker(speaker: Speaker): void {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
      this.blurTimeout = undefined;
    }

    if (!this.isSpeakerSelected(speaker)) {
      this.selectedSpeakers.push(speaker);
      this.speakerSearchTerm = '';
      this.filterSpeakers();

      setTimeout(() => {
        if (this.speakerSearchInput) {
          this.speakerSearchInput.nativeElement.focus();
        }
      }, 0);
    }
  }


  private initializeForm(): void {
    this.sessionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      abstractText: ['', [Validators.maxLength(2000)]],
      references: ['', [Validators.maxLength(1000)]],
      level: [''],
      track: ['', [Validators.maxLength(50)]],
      startDate: [''],
      startTime: ['']
    });
  }

  private loadAvailableSpeakers(): void {
    this.isLoadingSpeakers = true;

    this.speakerService.getSpeakersByEventId(this.eventId)
      .pipe(
        finalize(() => this.isLoadingSpeakers = false)
      )
      .subscribe({
        next: (speakers) => {
          this.availableSpeakers = speakers.sort((a, b) => a.name.localeCompare(b.name));
          this.initializeFilteredSpeakers();
        },
        error: (error) => {
          console.error('Error loading speakers:', error);
          this.availableSpeakers = [];
          this.filteredSpeakers = [];
        }
      });
  }

  private initializeFilteredSpeakers(): void {
    this.filteredSpeakers = [...this.availableSpeakers];
  }

  onSpeakerSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.speakerSearchTerm = target.value;
    this.filterSpeakers();
    this.showSpeakerDropdown = true;
    this.highlightedSpeakerIndex = -1;
  }

  private filterSpeakers(): void {
    if (!this.speakerSearchTerm.trim()) {
      this.filteredSpeakers = this.availableSpeakers.filter(speaker =>
        !this.isSpeakerSelected(speaker)
      );
    } else {
      const searchTerm : string = this.speakerSearchTerm.toLowerCase();
      this.filteredSpeakers = this.availableSpeakers.filter(speaker =>
        !this.isSpeakerSelected(speaker) &&
        (speaker.name.toLowerCase().includes(searchTerm) ||
          speaker.company?.toLowerCase().includes(searchTerm))
      );
    }
  }

  focusSpeakerSearch(): void {
    this.showSpeakerDropdown = true;
    this.filterSpeakers();
    setTimeout(() => {
      this.speakerSearchInput?.nativeElement.focus();
    }, 0);
  }

  removeSpeaker(speaker: Speaker): void {
    this.selectedSpeakers = this.selectedSpeakers.filter(s => s.id !== speaker.id);
    this.filterSpeakers();
  }

  isSpeakerSelected(speaker: Speaker): boolean {
    return this.selectedSpeakers.some(s => s.id === speaker.id);
  }

  onSpeakerKeydown(event: KeyboardEvent): void {
    if (!this.showSpeakerDropdown || this.filteredSpeakers.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedSpeakerIndex = Math.min(
          this.highlightedSpeakerIndex + 1,
          this.filteredSpeakers.length - 1
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.highlightedSpeakerIndex = Math.max(this.highlightedSpeakerIndex - 1, 0);
        break;

      case 'Enter':
        event.preventDefault();
        if (this.highlightedSpeakerIndex >= 0 && this.highlightedSpeakerIndex < this.filteredSpeakers.length) {
          this.selectSpeaker(this.filteredSpeakers[this.highlightedSpeakerIndex]);
        }
        break;

      case 'Escape':
        this.showSpeakerDropdown = false;
        this.speakerSearchInput.nativeElement.blur();
        break;
    }
  }

  getDurationLabel(minutes: number): string {
    const duration = this.durations.find(d => d.value === minutes);
    return duration ? duration.label : `${minutes} minutes`;
  }

  onDurationSelect(duration: number): void {
    this.selectedDuration = duration;
    this.showDurationDropdown = false;
  }

  onFormatChange(formatId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedFormats.push(formatId);
    } else {
      this.selectedFormats = this.selectedFormats.filter(id => id !== formatId);
    }
  }

  onCategoryChange(categoryId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedCategories.push(categoryId);
    } else {
      this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    }
  }

  onLanguageChange(languageCode: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedLanguages.push(languageCode);
    } else {
      this.selectedLanguages = this.selectedLanguages.filter(code => code !== languageCode);
    }
  }

  private calculateSessionTimes(startDate: string, startTime: string, duration: string):
    { startDateTime: Date | null, endDateTime: Date | null } {

    if (!startDate || !startTime || !duration) {
      return { startDateTime: null, endDateTime: null };
    }

    try {
      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const durationMinutes : number = parseInt(duration, 10);
      const endDateTime = new Date(startDateTime.getTime() + (durationMinutes * 60 * 1000));

      return { startDateTime, endDateTime };
    } catch (error) {
      console.error('Error calculating session times:', error);
      return { startDateTime: null, endDateTime: null };
    }
  }

  private getSelectedFormats(): Format[] {
    return this.availableFormats.filter(format =>
      this.selectedFormats.includes(format.id)
    );
  }

  private getSelectedCategories(): Category[] {
    return this.availableCategories.filter(category =>
      this.selectedCategories.includes(category.id)
    );
  }

  private setDefaultStartDate(): void {
    if (this.eventStartDate) {
      const defaultDate = this.formatDateForInput(this.eventStartDate);
      this.sessionForm.patchValue({ startDate: defaultDate });
    }
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  private formatDateForInput(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.sessionForm.invalid || this.isCreating) {
      return;
    }

    const formValue = this.sessionForm.value;
    if (formValue.startDate && !this.isDateWithinEventRange(formValue.startDate)) {
      this.errorMessage = 'Session date must be within the event date range';
      return;
    }

    this.isCreating = true;
    this.errorMessage = null;

    const { startDateTime, endDateTime } = this.calculateSessionTimes(
      formValue.startDate,
      formValue.startTime,
      this.selectedDuration.toString()
    );

    const sessionData = {
      title: formValue.title.trim(),
      abstractText: formValue.abstractText?.trim() || '',
      references: formValue.references?.trim() || '',
      level: formValue.level || '',
      track: formValue.track?.trim() || '',
      languages: this.selectedLanguages,
      formats: this.getSelectedFormats(),
      categories: this.getSelectedCategories(),
      speakers: this.selectedSpeakers,
      eventId: this.eventId,
      deliberationStatus: 'ACCEPTED',
      confirmationStatus: 'CONFIRMED',
      start: startDateTime,
      end: endDateTime
    };

    this.sessionService.createSession(this.eventId, sessionData)
      .pipe(
        finalize(() => this.isCreating = false)
      )
      .subscribe({
        next: () => {
          this.sessionCreated.emit();
          this.onClose();
        },
        error: (error) => {
          console.error('Error creating session:', error);
          this.errorMessage = error.error?.message || 'Failed to create session. Please try again.';
        }
      });
  }

  private isDateWithinEventRange(dateString: string): boolean {
    if (!this.eventStartDate || !this.eventEndDate) {
      return true;
    }

    const sessionDate = new Date(dateString);
    const eventStart = new Date(this.eventStartDate);
    const eventEnd = new Date(this.eventEndDate);

    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(23, 59, 59, 999);
    sessionDate.setHours(12, 0, 0, 0);

    return sessionDate >= eventStart && sessionDate <= eventEnd;
  }

  onClose(): void {
    this.popupClosed.emit();
  }
}
