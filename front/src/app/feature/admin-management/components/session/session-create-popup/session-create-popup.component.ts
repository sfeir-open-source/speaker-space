import { Component, computed, DestroyRef, effect, inject, input, OnInit, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { SessionService } from '../../../services/sessions/session.service';
import { SpeakerService } from '../../../services/speaker/speaker.service';
import { Category, Format, SessionImportData, Speaker } from '../../../type/session/session';
import { SessionCreateRequest } from '../../../type/session/session-create';
import { ModalPopupCreateComponent } from '../../modal/modal-popup-create.component';
import { FormModalService } from '../../services/form-modal.service';
import { SessionFormFieldsComponent } from '../fields/session-form-fields/session-form-fields.component';

@Component({
  selector: 'app-session-create-popup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ModalPopupCreateComponent,
    SessionFormFieldsComponent
  ],
  templateUrl: './session-create-popup.component.html',
  styleUrl: './session-create-popup.component.scss'
})
export class SessionCreatePopupComponent
  extends FormModalService<any, SessionCreateRequest, SessionImportData>
  implements OnInit {
  eventId = input.required<string>();
  availableFormats = input<Format[]>([]);
  availableCategories = input<Category[]>([]);
  availableTracks = input<string[]>([]);
  eventStartDate = input<Date | undefined>(undefined);
  eventEndDate = input<Date | undefined>(undefined);

  sessionCreated = output<void>();
  popupClosed = output<void>();

  private readonly sessionService = inject(SessionService);
  private readonly speakerService = inject(SpeakerService);
  protected override readonly _destroyRef = inject(DestroyRef);

  sessionForm!: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  isLoadingSpeakers = signal(false);
  isLoadingEmptySessions = signal(false);

  availableSpeakers = signal<Speaker[]>([]);
  availableEmptySessions = signal<SessionImportData[]>([]);
  selectedEmptySession = signal<SessionImportData | null>(null);

  selectedFormats = signal<string[]>([]);
  selectedCategories = signal<string[]>([]);
  selectedSpeakers = signal<Speaker[]>([]);
  selectedLanguages = signal<string[]>([]);
  selectedDuration = signal(60);

  isFormValid = computed(() =>
    this.sessionForm?.valid && !this.isSubmitting()
  );

  sortedAvailableSpeakers = computed(() =>
    [...this.availableSpeakers()].sort((a, b) => a.name.localeCompare(b.name))
  );

  matchingEmptySession = computed(() => {
    const speakers = this.selectedSpeakers();
    const emptySessions = this.availableEmptySessions();

    if (!speakers.length || !emptySessions.length) {
      return null;
    }

    const speakerEmails = speakers.map(s => s.email);
    return emptySessions.find(session =>
      session.speakers.some(speaker => speakerEmails.includes(speaker.email))
    ) || null;
  });

  get form(): FormGroup<any> {
    return this.sessionForm;
  }

  constructor() {
    super();

    effect(() => {
      const emptySession = this.matchingEmptySession();
      if (emptySession) {
        this.prefillFormFromEmptySession(emptySession);
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadAvailableSpeakers();
    this.loadEmptySessions();
    this.setDefaultStartDate();
  }

  protected initializeForm(): void {
    this.sessionForm = this.fb.group({
      title: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200)
      ]],
      abstractText: ['', [Validators.maxLength(2000)]],
      references: ['', [Validators.maxLength(1000)]],
      level: [''],
      track: ['', [Validators.maxLength(50)]],
      startDate: ['', [
        Validators.required,
        this.eventDateRangeValidator.bind(this)
      ]],
      startTime: ['']
    });
  }

  protected buildCreateRequest(): SessionCreateRequest {
    const formValue = this.sessionForm.value;
    const { startDateTime, endDateTime } = this.calculateSessionTimes(
      formValue.startDate,
      formValue.startTime,
      this.selectedDuration().toString()
    );

    return {
      title: formValue.title.trim(),
      abstractText: formValue.abstractText?.trim() || '',
      references: formValue.references?.trim() || '',
      level: formValue.level || '',
      track: formValue.track?.trim() || '',
      languages: [...this.selectedLanguages()],
      formats: this.getSelectedFormats(),
      categories: this.getSelectedCategories(),
      speakers: [...this.selectedSpeakers()],
      eventId: this.eventId(),
      deliberationStatus: 'ACCEPTED',
      confirmationStatus: 'CONFIRMED',
      start: startDateTime,
      end: endDateTime
    };
  }

  protected submitRequest(request: SessionCreateRequest): Observable<SessionImportData> {
    return this.sessionService.createSession(this.eventId(), request);
  }

  protected onSuccess(response: SessionImportData): void {
    this.sessionCreated.emit();
    this.onClose();
  }

  protected extractErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400 && error.error?.errors) {
      const validationErrors = error.error.errors;
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        return validationErrors[0].defaultMessage || validationErrors[0];
      }
    }

    if (error.error?.message) {
      return error.error.message;
    }

    const statusMessages: Record<number, string> = {
      400: 'Invalid session data. Please check your inputs.',
      403: 'You do not have permission to create sessions for this event.',
      404: 'Event not found.',
      409: 'A session with this title already exists.',
      500: 'Server error. Please try again later.'
    };

    return statusMessages[error.status] || 'Failed to create session. Please try again.';
  }

  onDurationChange(duration: number): void {
    this.selectedDuration.set(duration);
  }

  onSpeakersChange(speakers: Speaker[]): void {
    this.selectedSpeakers.set(speakers);
  }

  onFormatsChange(formats: string[]): void {
    this.selectedFormats.set(formats);
  }

  onCategoriesChange(categories: string[]): void {
    this.selectedCategories.set(categories);
  }

  onLanguagesChange(languages: string[]): void {
    this.selectedLanguages.set(languages);
  }

  onClose(): void {
    if (this.isSubmitting()) return;
    this.popupClosed.emit();
  }

  private loadAvailableSpeakers(): void {
    this.isLoadingSpeakers.set(true);

    this.speakerService.getSpeakersByEventId(this.eventId())
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoadingSpeakers.set(false))
      )
      .subscribe({
        next: (speakers) => {
          this.availableSpeakers.set(speakers);
        },
        error: (error) => {
          console.error('Error loading speakers:', error);
          this.availableSpeakers.set([]);
        }
      });
  }

  private loadEmptySessions(): void {
    this.isLoadingEmptySessions.set(true);

    this.sessionService.getEmptySessionsForEvent(this.eventId())
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoadingEmptySessions.set(false))
      )
      .subscribe({
        next: (sessions) => {
          this.availableEmptySessions.set(sessions);
        },
        error: (error) => {
          console.error('Error loading empty sessions:', error);
          this.availableEmptySessions.set([]);
        }
      });
  }

  private setDefaultStartDate(): void {
    const startDate = this.eventStartDate();
    if (startDate) {
      const defaultDate = this.formatDateForInput(startDate);
      this.sessionForm.patchValue({ startDate: defaultDate });
    }
  }

  private formatDateForInput(date: Date): string {
    if (!date || isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

  private calculateSessionTimes(
    startDate: string,
    startTime: string,
    duration: string
  ): { startDateTime: Date | null; endDateTime: Date | null } {
    if (!startDate || !startTime || !duration) {
      return { startDateTime: null, endDateTime: null };
    }

    try {
      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const durationMinutes = parseInt(duration, 10);
      const endDateTime = new Date(startDateTime.getTime() + (durationMinutes * 60 * 1000));
      return { startDateTime, endDateTime };
    } catch (error) {
      console.error('Error calculating session times:', error);
      return { startDateTime: null, endDateTime: null };
    }
  }

  private getSelectedFormats(): Format[] {
    const formats = this.availableFormats();
    const selected = this.selectedFormats();
    return formats.filter(format => selected.includes(format.id));
  }

  private getSelectedCategories(): Category[] {
    const categories = this.availableCategories();
    const selected = this.selectedCategories();
    return categories.filter(category => selected.includes(category.id));
  }

  private eventDateRangeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const startDate = this.eventStartDate();
    const endDate = this.eventEndDate();

    if (!startDate || !endDate) {
      return null;
    }

    const selectedDate = new Date(control.value);
    const eventStart = new Date(startDate);
    const eventEnd = new Date(endDate);

    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(23, 59, 59, 999);
    selectedDate.setHours(12, 0, 0, 0);

    if (selectedDate < eventStart || selectedDate > eventEnd) {
      return {
        eventDateOutOfRange: {
          selectedDate: selectedDate.toISOString().split('T')[0],
          eventStart: eventStart.toISOString().split('T')[0],
          eventEnd: eventEnd.toISOString().split('T')[0]
        }
      };
    }

    return null;
  }

  private prefillFormFromEmptySession(session: SessionImportData): void {
    const speaker = session.speakers[0];
    const currentTitle = this.sessionForm.get('title')?.value;

    if (speaker && !currentTitle) {
      this.sessionForm.patchValue({
        title: `Session by ${speaker.name}`
      });
    }
  }
}
