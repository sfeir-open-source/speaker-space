import {Component, EventEmitter, Input, OnInit, OnDestroy, Output, inject, DestroyRef} from '@angular/core';
import {
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import {SessionService} from '../../../services/sessions/session.service';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {Category, Format, SessionImportData, Speaker} from '../../../type/session/session';
import {ModalPopupCreateComponent} from '../../modal/modal-popup-create.component';
import {FormModalService} from '../../services/form-modal.service';
import {SessionCreateRequest} from '../../../type/session/session-create';
import {Observable} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {SessionFormFieldsComponent} from '../fields/session-form-fields/session-form-fields.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-session-create-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalPopupCreateComponent, SessionFormFieldsComponent],
  templateUrl: './session-create-popup.component.html',
  styleUrl: './session-create-popup.component.scss'
})
export class SessionCreatePopupComponent extends FormModalService<any, SessionCreateRequest, SessionImportData> implements OnInit, OnDestroy {
  @Input() eventId!: string;
  @Input() availableFormats: Format[] = [];
  @Input() availableCategories: Category[] = [];
  @Input() availableTracks: string[] = [];
  @Input() eventStartDate?: Date;
  @Input() eventEndDate?: Date;

  @Output() sessionCreated = new EventEmitter<void>();
  @Output() popupClosed = new EventEmitter<void>();

  private readonly sessionService = inject(SessionService);
  private readonly speakerService = inject(SpeakerService);
  protected override readonly _destroyRef = inject(DestroyRef);
  availableEmptySessions: SessionImportData[] = [];
  selectedEmptySession: SessionImportData | null = null;
  isLoadingEmptySessions: boolean = false;

  sessionForm!: FormGroup;
  isSubmitting: boolean = false;
  isLoadingSpeakers: boolean = false;
  errorMessage: string | null = null;

  selectedFormats: string[] = [];
  selectedCategories: string[] = [];
  selectedSpeakers: Speaker[] = [];
  selectedLanguages: string[] = [];
  selectedDuration: number = 60;
  availableSpeakers: Speaker[] = [];

  get form(): FormGroup<any> {
    return this.sessionForm;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadAvailableSpeakers();
    this.loadEmptySessions();
    this.setDefaultStartDate();
  }

  ngOnDestroy(): void {
  }

  protected initializeForm(): void {
    this.sessionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      abstractText: ['', [Validators.maxLength(2000)]],
      references: ['', [Validators.maxLength(1000)]],
      level: [''],
      track: ['', [Validators.maxLength(50)]],
      startDate: ['', [Validators.required, this.eventDateRangeValidator.bind(this)]],
      startTime: ['']
    });
  }

  protected buildCreateRequest(): SessionCreateRequest {
    const formValue = this.sessionForm.value;
    const { startDateTime, endDateTime } = this.calculateSessionTimes(
      formValue.startDate,
      formValue.startTime,
      this.selectedDuration.toString()
    );

    return {
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
  }

  protected submitRequest(request: SessionCreateRequest): Observable<SessionImportData> {
    return this.sessionService.createSession(this.eventId, request);
  }

  protected onSuccess(response: SessionImportData): void {
    this.sessionCreated.emit();
    this.onClose();
  }

  protected extractErrorMessage(error: HttpErrorResponse): string {
    return error.error?.message || 'Failed to create session. Please try again.';
  }

  onDurationChange(duration: number): void {
    this.selectedDuration = duration;
  }

  onSpeakersChange(speakers: Speaker[]): void {
    this.selectedSpeakers = speakers;
    this.checkForEmptySession(speakers);
  }

  onFormatsChange(formats: string[]): void {
    this.selectedFormats = formats;
  }

  onCategoriesChange(categories: string[]): void {
    this.selectedCategories = categories;
  }

  onLanguagesChange(languages: string[]): void {
    this.selectedLanguages = languages;
  }

  onClose(): void {
    if (this.isSubmitting) return;
    this.popupClosed.emit();
  }

  private loadAvailableSpeakers(): void {
    this.isLoadingSpeakers = true;
    this.speakerService.getSpeakersByEventId(this.eventId)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoadingSpeakers = false))
      .subscribe({
        next: (speakers) => {
          this.availableSpeakers = speakers.sort((a, b) => a.name.localeCompare(b.name));
        },
        error: (error) => {
          console.error('Error loading speakers:', error);
          this.availableSpeakers = [];
        }
      });
  }

  private setDefaultStartDate(): void {
    if (this.eventStartDate) {
      const defaultDate = this.formatDateForInput(this.eventStartDate);
      this.sessionForm.patchValue({ startDate: defaultDate });
    }
  }

  private formatDateForInput(date: Date): string {
    if (!date || isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

  private calculateSessionTimes(startDate: string, startTime: string, duration: string):
    { startDateTime: Date | null, endDateTime: Date | null } {
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
    return this.availableFormats.filter(format =>
      this.selectedFormats.includes(format.id)
    );
  }

  private getSelectedCategories(): Category[] {
    return this.availableCategories.filter(category =>
      this.selectedCategories.includes(category.id)
    );
  }


  private eventDateRangeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || !this.eventStartDate || !this.eventEndDate) {
      return null;
    }

    const selectedDate = new Date(control.value);
    const eventStart = new Date(this.eventStartDate);
    const eventEnd = new Date(this.eventEndDate);

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

  private loadEmptySessions(): void {
    this.isLoadingEmptySessions = true;
    this.sessionService.getEmptySessionsForEvent(this.eventId)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoadingEmptySessions = false)
      )
      .subscribe({
        next: (sessions) => {
          this.availableEmptySessions = sessions;
        },
        error: (error) => {
          console.error('Error loading empty sessions:', error);
          this.availableEmptySessions = [];
        }
      });
  }



  private checkForEmptySession(speakers: Speaker[]): void {
    if (!speakers.length || !this.availableEmptySessions.length) {
      this.selectedEmptySession = null;
      return;
    }

    const speakerEmails = speakers.map(s => s.email);

    this.selectedEmptySession = this.availableEmptySessions.find(session =>
      session.speakers.some(speaker => speakerEmails.includes(speaker.email))
    ) || null;

    if (this.selectedEmptySession) {
      this.prefillFormFromEmptySession(this.selectedEmptySession);
    }
  }

  private prefillFormFromEmptySession(session: SessionImportData): void {
    const speaker = session.speakers[0];
    if (speaker && !this.sessionForm.get('title')?.value) {
      this.sessionForm.patchValue({
        title: `Session by ${speaker.name}`
      });
    }
  }
}
