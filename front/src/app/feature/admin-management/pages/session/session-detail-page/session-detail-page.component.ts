import { Component, DestroyRef, HostListener, inject, OnInit, signal, computed } from '@angular/core';
import { Category, Format, SessionImportData } from '../../../type/session/session';
import { finalize, Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../services/sessions/session.service';
import { NavbarSessionPageComponent } from '../../../components/session/navbar-session-page/navbar-session-page.component';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { SessionScheduleUpdate } from '../../../type/session/schedule-json-data';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isDefined } from '../../../../../shared/type/predicates';
import { BaseDetailService, DetailState } from '../../../components/services/base-detail.service';
import { AsyncPipe } from '@angular/common';
import {ButtonComponent} from '../../../../../shared/button/button.component';

interface DurationOption {
  readonly label: string;
  readonly value: number;
}

@Component({
  selector: 'app-session-detail-page',
  standalone: true,
  imports: [
    NavbarSessionPageComponent,
    ReactiveFormsModule,
    AsyncPipe,
    ButtonComponent
  ],
  providers: [BaseDetailService],
  templateUrl: './session-detail-page.component.html',
  styleUrl: './session-detail-page.component.scss'
})
export class SessionDetailPageComponent implements OnInit {
  readonly sessionId = signal<string>('');
  readonly session = signal<SessionImportData | null>(null);
  readonly format = signal<Format | null>(null);
  readonly category = signal<Category | null>(null);
  readonly isEditingSchedule = signal<boolean>(false);
  readonly isUpdatingSchedule = signal<boolean>(false);
  readonly scheduleError = signal<string | null>(null);
  readonly showDurationDropdown = signal<boolean>(false);
  readonly availableTracks = signal<string[]>([]);
  readonly selectedDuration = signal<number>(60);

  readonly hasSessionData = computed(() => !!this.session());
  readonly canEditSchedule = computed(() => this.hasSessionData() && !this.isUpdatingSchedule());
  readonly hasScheduleInfo = computed(() => {
    const sessionData = this.session();
    return isDefined(sessionData?.start || sessionData?.track);
  });

  readonly formattedCompleteSessionInfo = computed(() => {
    const sessionData = this.session();
    if (!sessionData) return '';

    const parts: string[] = [];

    if (sessionData.start) {
      try {
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        };

        const dateStr = sessionData.start.toLocaleDateString('en-US', options);
        const timeStr = sessionData.start.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        parts.push(`<strong class="font-medium"> ${dateStr} </strong> at <strong class="font-medium">${timeStr}</strong>`);
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }

    if (sessionData.track) {
      parts.push(`in room <strong class="font-medium">${this.getTrackName()}</strong>`);
    }

    return parts.join(' ');
  });

  readonly formattedTrackName = computed(() => {
    const sessionData = this.session();
    if (!sessionData?.track) return '';

    if (sessionData.track.includes(' ')) {
      return sessionData.track;
    }

    return sessionData.track
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });

  scheduleForm!: FormGroup;

  readonly durations: readonly DurationOption[] = [20, 30, 40, 45, 50, 60, 75, 90, 105, 110, 120, 130].map(val => {
    const hours = Math.floor(val / 60);
    const minutes = val % 60;
    let label = '';
    if (hours > 0) {
      label += `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      if (hours > 0) label += ' ';
      label += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return { label, value: val } as const;
  });

  readonly detailService = inject(BaseDetailService);
  readonly state$: Observable<DetailState> = this.detailService.state$;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly sessionService: SessionService,
    private readonly router: Router,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeScheduleForm();
    this.initializeRouteSubscription();
  }

  private initializeRouteSubscription(): void {
    this.detailService.initializeRouteSubscription(
      this.route,
      ['eventId', 'sessionId'],
      (params) => this.loadSessionData(params)
    );
  }

  private async loadSessionData(params: Record<string, string>): Promise<void> {
    const sessionId = params['sessionId'];
    const eventId = params['eventId'];

    this.sessionId.set(sessionId);

    try {
      const [session, tracks] = await Promise.all([
        this.sessionService.getSessionById(eventId, sessionId).toPromise(),
        this.sessionService.getAvailableTracksForEvent(eventId).toPromise()
      ]);

      this.session.set(session!);
      this.availableTracks.set(tracks || []);
      this.format.set(session!.formats?.[0] || null);
      this.category.set(session!.categories?.[0] || null);
    } catch (error) {
      this.detailService.updateState({ error: 'Failed to load session data' });
      throw error;
    }
  }

  private initializeScheduleForm(): void {
    this.scheduleForm = this.fb.group({
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      duration: [60, [Validators.required, Validators.min(15)]],
      track: ['', [Validators.maxLength(50)]]
    }, {
      validators: [this.scheduleValidator.bind(this)]
    });
  }

  private scheduleValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('startDate')?.value;
    const startTime = control.get('startTime')?.value;
    const duration = control.get('duration')?.value;

    if (!startDate || !startTime || !duration) {
      return null;
    }

    if (duration <= 0) {
      return { invalidDuration: true };
    }

    return null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showDurationDropdown.set(false);
    }
  }

  onImageError = (event: Event): void => {
    this.detailService.handleImageError(event);
  };

  onEditSession(): void {
    if (!this.canEditSchedule()) return;

    this.isEditingSchedule.set(true);
    this.scheduleError.set(null);
    this.populateScheduleForm();
  }

  private populateScheduleForm(): void {
    const sessionData = this.session();
    if (!sessionData || !this.scheduleForm) return;

    const formValues: any = {
      track: sessionData.track || '',
      startDate: this.getStartDateValue(),
      startTime: this.getStartTimeValue()
    };

    if (sessionData.start && sessionData.end) {
      try {
        const startDate = new Date(sessionData.start);
        const endDate = new Date(sessionData.end);
        const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

        if (durationMinutes > 0) {
          formValues.duration = durationMinutes;
          this.selectedDuration.set(durationMinutes);
        }
      } catch (error) {
        console.warn('Error calculating duration:', error);
        formValues.duration = 60;
        this.selectedDuration.set(60);
      }
    } else {
      formValues.duration = 60;
      this.selectedDuration.set(60);
    }

    this.scheduleForm.patchValue(formValues);
  }

  getStartTimeValue(): string {
    const sessionData = this.session();
    if (sessionData?.start) {
      try {
        return this.formatTimeForInput(new Date(sessionData.start));
      } catch (error) {
        console.warn('Error formatting start time:', error);
        return '';
      }
    }
    return '';
  }

  getStartDateValue(): string {
    const sessionData = this.session();
    if (sessionData?.start) {
      try {
        return this.formatDateForInput(new Date(sessionData.start));
      } catch (error) {
        console.warn('Error formatting start date:', error);
        return '';
      }
    }
    return '';
  }

  getTrackName(): string {
    return this.formattedTrackName();
  }

  public formatDateForInput(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  }

  public formatTimeForInput(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    return date.toTimeString().slice(0, 5);
  }

  onDurationSelect(duration: number): void {
    this.selectedDuration.set(duration);
    this.scheduleForm.patchValue({ duration: duration });
    this.showDurationDropdown.set(false);
  }

  onSaveSchedule(): void {
    if (!this.scheduleForm || this.scheduleForm.invalid || this.isUpdatingSchedule()) {
      return;
    }

    const formValues = this.scheduleForm.value;
    const startDate = this.combineDateAndTime(formValues.startDate, formValues.startTime);

    if (!startDate) {
      this.scheduleError.set('Please provide a valid start date and time');
      return;
    }

    const endDate = this.calculateEndDate(startDate, formValues.duration);
    const currentState = this.detailService.getCurrentState();

    const scheduleUpdate: SessionScheduleUpdate = {
      start: startDate,
      end: endDate,
      track: formValues.track?.trim() || undefined
    };

    this.isUpdatingSchedule.set(true);
    this.scheduleError.set(null);

    this.sessionService.updateSessionSchedule(currentState.eventId, this.sessionId(), scheduleUpdate)
      .pipe(
        finalize(() => this.isUpdatingSchedule.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updatedSession) => {
          this.session.set(updatedSession);
          this.isEditingSchedule.set(false);
          this.scheduleError.set(null);
        },
        error: (error) => {
          console.error('Error updating session schedule:', error);
          this.scheduleError.set(error.error?.message || 'Failed to update session schedule');
        }
      });
  }

  onCancelScheduleEdit(): void {
    this.isEditingSchedule.set(false);
    this.scheduleError.set(null);
    this.showDurationDropdown.set(false);
    if (this.scheduleForm) {
      this.scheduleForm.reset();
    }
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

      return languageName ?
        languageName.charAt(0).toUpperCase() + languageName.slice(1) :
        languageCode.toUpperCase();

    } catch (error) {
      console.warn(`Unable to format language code: ${languageCode}`, error);
      return languageCode.toUpperCase();
    }
  }

  openItemDetail(speakerId: string): void {
    const currentState = this.detailService.getCurrentState();
    this.router.navigate(['event', currentState.eventId, 'speaker', speakerId]);
  }

  private calculateEndDate(startDate: Date, durationMinutes: number): Date {
    return new Date(startDate.getTime() + (durationMinutes * 60 * 1000));
  }

  private combineDateAndTime(dateStr: string, timeStr: string): Date | null {
    if (!dateStr || !timeStr) return null;
    const combinedStr = `${dateStr}T${timeStr}:00`;
    const date = new Date(combinedStr);
    return isNaN(date.getTime()) ? null : date;
  }

  formatCompleteSessionInfo(): string {
    return this.formattedCompleteSessionInfo();
  }
}
