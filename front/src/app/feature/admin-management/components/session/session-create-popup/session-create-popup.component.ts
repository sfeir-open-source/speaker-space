import { Component, OnInit, inject, input, output, signal, computed, effect, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {Category, Format, SessionImportData, Speaker} from '../../../type/session/session';
import {SessionService} from '../../../services/sessions/session.service';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {SessionCreateRequest} from '../../../type/session/session-create';
import {ModalPopupCreateComponent} from '../../modal/modal-popup-create.component';
import {SessionFormFieldsComponent} from '../fields/session-form-fields/session-form-fields.component';
import {HttpErrorHandlerService} from '../../services/create/http-error-handler.service';
import {SessionDateCalculatorService} from '../../services/create/session-date-calculator.service';
import {FormSubmissionService} from '../../services/create/form-submission.service';
import {SessionRequestBuilderService} from '../../services/create/session-request-builder.service';

@Component({
  selector: 'app-session-create-popup',
  templateUrl: './session-create-popup.component.html',
  imports: [ModalPopupCreateComponent, ReactiveFormsModule, SessionFormFieldsComponent],
  standalone: true,
  providers: [FormSubmissionService, SessionRequestBuilderService]
})
export class SessionCreatePopupComponent implements OnInit {
  eventId = input.required<string>();
  availableFormats = input<Format[]>([]);
  availableCategories = input<Category[]>([]);
  availableTracks = input<string[]>([]);
  eventStartDate = input<Date | undefined>(undefined);
  eventEndDate = input<Date | undefined>(undefined);

  sessionCreated = output<void>();
  popupClosed = output<void>();

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

  isFormValid = computed(() => {
    const formValid = this.sessionForm?.valid ?? false;
    const notSubmitting = !this.isSubmitting();

    Object.keys(this.sessionForm?.controls || {}).forEach(key => {
      const control = this.sessionForm.get(key);
      console.log(`Field "${key}":`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors,
        touched: control?.touched,
        dirty: control?.dirty
      });
    });

    return formValid && notSubmitting;
  });

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

  constructor() {
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
      .subscribe(() => {
        console.log(' Form changed, triggering validation check');
      });

    this.sessionForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {
        console.log('Form status changed:', status);
      });
  }

  onSubmit(): void {

    if (!this.sessionForm.valid) {
      this.sessionForm.markAllAsTouched();
      console.log('Form errors:', this.sessionForm.errors);

      Object.keys(this.sessionForm.controls).forEach(key => {
        const control = this.sessionForm.get(key);
        if (control?.invalid) {
          console.error(`Field "${key}" errors:`, control.errors);
        }
      });

      console.groupEnd();
      return;
    }

    this.formSubmission.submit({
      form: this.sessionForm,
      isSubmitting: this.isSubmitting,
      errorMessage: this.errorMessage,
      buildRequest: () => {
        const request = this.buildCreateRequest();
        return request;
      },
      submitRequest: (request) => {
        return this.sessionService.createSession(this.eventId(), request);
      },
      onSuccess: (response) => {
        this.onSuccess(response);
      },
      extractError: (error) => {
        return this.errorHandler.extractSessionErrorMessage(error);
      }
    });
  }

  private buildCreateRequest(): SessionCreateRequest {
    const formValue = this.sessionForm.value;
    const selectedFormats = this.requestBuilder.getSelectedFormats(
      this.availableFormats(),
      this.selectedFormats()
    );
    const selectedCategories = this.requestBuilder.getSelectedCategories(
      this.availableCategories(),
      this.selectedCategories()
    );

    return this.requestBuilder.buildCreateRequest(
      formValue,
      this.eventId(),
      this.selectedDuration(),
      this.selectedLanguages(),
      selectedFormats,
      selectedCategories,
      this.selectedSpeakers()
    );
  }

  private onSuccess(response: SessionImportData): void {
    this.sessionCreated.emit();
    this.onClose();
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

    this.sessionService.getEmptySessionsForEvent(this.eventId())
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
    const startDate = this.eventStartDate();
    if (startDate) {
      const defaultDate = this.dateCalculator.formatDateForInput(startDate);
      this.sessionForm.patchValue({ startDate: defaultDate });
    }
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
