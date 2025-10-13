import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {SessionService} from './session.service';
import {SpeakerService} from '../speaker/speaker.service';
import {FormSubmissionService} from '../../components/services/create/form-submission.service';
import {SessionCreateRequest} from '../../type/session/session-create';
import {Category, Format, SessionImportData, Speaker} from '../../type/session/session';
import {HttpErrorHandlerService} from '../../components/services/create/http-error-handler.service';
import {SessionDateCalculatorService} from '../../components/services/create/session-date-calculator.service';
import {SessionRequestBuilderService} from '../../components/services/create/session-request-builder.service';

@Injectable()
export class SessionCreateStateService {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sessionService = inject(SessionService);
  private readonly speakerService = inject(SpeakerService);
  private readonly formSubmission = inject(FormSubmissionService<SessionCreateRequest, SessionImportData>);
  private readonly errorHandler = inject(HttpErrorHandlerService);
  private readonly dateCalculator = inject(SessionDateCalculatorService);
  private readonly requestBuilder = inject(SessionRequestBuilderService);

  sessionForm!: FormGroup;

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  isLoadingSpeakers = signal(false);
  isLoadingEmptySessions = signal(false);
  availableSpeakers = signal<Speaker[]>([]);
  availableEmptySessions = signal<SessionImportData[]>([]);
  selectedFormats = signal<string[]>([]);
  selectedCategories = signal<string[]>([]);
  selectedSpeakers = signal<Speaker[]>([]);
  selectedLanguages = signal<string[]>([]);
  selectedDuration = signal(60);

  sortedAvailableSpeakers = computed(() =>
    [...this.availableSpeakers()].sort((a, b) => a.name.localeCompare(b.name))
  );

  matchingEmptySession = computed(() => {
    const speakers = this.selectedSpeakers();
    const emptySessions = this.availableEmptySessions();

    if (!speakers.length || !emptySessions.length) return null;

    const speakerEmails = speakers.map(s => s.email);
    return emptySessions.find(session =>
      session.speakers.some(speaker => speakerEmails.includes(speaker.email))
    ) || null;
  });

  private eventConfig = {
    eventId: '',
    availableFormats: [] as Format[],
    availableCategories: [] as Category[],
    eventStartDate: undefined as Date | undefined,
    eventEndDate: undefined as Date | undefined
  };

  initialize(config: {
    eventId: string;
    availableFormats: Format[];
    availableCategories: Category[];
    eventStartDate: Date | undefined;
    eventEndDate: Date | undefined;
  }): void {
    this.eventConfig = config;
    this.initializeForm();
    this.loadAvailableSpeakers();
    this.loadEmptySessions();
    this.setDefaultStartDate();
  }

  private initializeForm(): void {
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

    this.sessionForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => console.log('Form changed'));

    this.sessionForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => console.log('Form status:', status));
  }

  submit(onSuccess: (response: SessionImportData) => void): void {
    if (!this.sessionForm.valid) {
      this.sessionForm.markAllAsTouched();
      this.logFormErrors();
      return;
    }

    this.formSubmission.submit({
      form: this.sessionForm,
      isSubmitting: this.isSubmitting,
      errorMessage: this.errorMessage,
      buildRequest: () => this.buildCreateRequest(),
      submitRequest: (request) =>
        this.sessionService.createSession(this.eventConfig.eventId, request),
      onSuccess,
      extractError: (error) =>
        this.errorHandler.extractSessionErrorMessage(error)
    });
  }

  private buildCreateRequest(): SessionCreateRequest {
    const formValue = this.sessionForm.value;
    const selectedFormats = this.requestBuilder.getSelectedFormats(
      this.eventConfig.availableFormats,
      this.selectedFormats()
    );
    const selectedCategories = this.requestBuilder.getSelectedCategories(
      this.eventConfig.availableCategories,
      this.selectedCategories()
    );

    return this.requestBuilder.buildCreateRequest(
      formValue,
      this.eventConfig.eventId,
      this.selectedDuration(),
      this.selectedLanguages(),
      selectedFormats,
      selectedCategories,
      this.selectedSpeakers()
    );
  }

  private loadAvailableSpeakers(): void {
    this.isLoadingSpeakers.set(true);

    this.speakerService.getSpeakersByEventId(this.eventConfig.eventId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingSpeakers.set(false))
      )
      .subscribe({
        next: (speakers) => this.availableSpeakers.set(speakers),
        error: (error) => {
          console.error('Error loading speakers:', error);
          this.availableSpeakers.set([]);
        }
      });
  }

  private loadEmptySessions(): void {
    this.isLoadingEmptySessions.set(true);

    this.sessionService.getEmptySessionsForEvent(this.eventConfig.eventId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingEmptySessions.set(false))
      )
      .subscribe({
        next: (sessions) => this.availableEmptySessions.set(sessions),
        error: (error) => {
          console.error('Error loading empty sessions:', error);
          this.availableEmptySessions.set([]);
        }
      });
  }

  private setDefaultStartDate(): void {
    const startDate = this.eventConfig.eventStartDate;
    if (startDate) {
      const defaultDate = this.dateCalculator.formatDateForInput(startDate);
      this.sessionForm.patchValue({ startDate: defaultDate });
    }
  }

  private eventDateRangeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const { eventStartDate, eventEndDate } = this.eventConfig;
    if (!eventStartDate || !eventEndDate) return null;

    const selectedDate = new Date(control.value);
    const eventStart = new Date(eventStartDate);
    const eventEnd = new Date(eventEndDate);

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

  prefillFormFromEmptySession(session: SessionImportData): void {
    const speaker = session.speakers[0];
    const currentTitle = this.sessionForm.get('title')?.value;

    if (speaker && !currentTitle) {
      this.sessionForm.patchValue({
        title: `Session by ${speaker.name}`
      });
    }
  }

  private logFormErrors(): void {
    console.log('Form errors:', this.sessionForm.errors);
    Object.keys(this.sessionForm.controls).forEach(key => {
      const control = this.sessionForm.get(key);
      if (control?.invalid) {
        console.error(`Field "${key}" errors:`, control.errors);
      }
    });
  }
}
