import {Component, HostListener} from '@angular/core';
import {Category, Format, SessionImportData} from '../../../type/session/session';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {finalize, takeUntil} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {SessionService} from '../../../services/sessions/session.service';
import {
  NavbarSessionPageComponent
} from '../../../components/session/navbar-session-page/navbar-session-page.component';
import {BaseDetailComponent} from '../../../components/class/bade-detail-component';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {SessionScheduleUpdate} from '../../../type/session/schedule-json-data';
import {ButtonGreenActionsComponent} from '../../../../../shared/button-green-actions/button-green-actions.component';

@Component({
    selector: 'app-session-detail-page',
  imports: [
    ButtonGreyComponent,
    NavbarSessionPageComponent,
    ReactiveFormsModule,
    ButtonGreenActionsComponent
  ],
    templateUrl: './session-detail-page.component.html',
    styleUrl: './session-detail-page.component.scss'
})
export class SessionDetailPageComponent extends BaseDetailComponent {
  sessionId: string = '';
  session: SessionImportData | null = null;
  format: Format | null = null;
  category: Category | null = null;
  isEditingSchedule: boolean = false;
  isUpdatingSchedule: boolean = false;
  scheduleForm!: FormGroup;
  scheduleError: string | null = null;
  showDurationDropdown: boolean = false;

  availableTracks: string[] = [];
  selectedDuration: number = 60;
  durations = [
    { label: '20 minutes', value: 20 },
    { label: '30 minutes', value: 30 },
    { label: '40 minutes', value: 40 },
    { label: '45 minutes', value: 45 },
    { label: '50 minutes', value: 50 },
    { label: '1 hour', value: 60 },
    { label: '1 hour 15 min', value: 75 },
    { label: '1 hour 30 min', value: 90 },
    { label: '1 hour 45 min', value: 105 },
    { label: '1 hour 50 min', value: 110 },
    { label: '2 hours', value: 120 },
    { label: '2 hours 10 min', value: 130 },
  ];

  constructor(
    route: ActivatedRoute,
    eventService: EventService,
    private sessionService: SessionService,
    protected router: Router,
    private fb: FormBuilder,
  ) {
    super(route, eventService);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.initializeScheduleForm();
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
      this.showDurationDropdown = false;
    }
  }

  protected subscribeToRouteParams(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.eventId = params.get('eventId') || '';
      this.sessionId = params.get('sessionId') || '';

      if (this.eventId && this.sessionId) {
        this.loadEventAndDetailData();
      } else {
        this.error = 'Event ID or Session ID is missing from route parameters';
        this.isLoading = false;
      }
    });
  }

  protected loadDetailData(): Promise<void> {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.sessionService.getSessionById(this.eventId, this.sessionId).toPromise(),
        this.sessionService.getAvailableTracksForEvent(this.eventId).toPromise()
      ]).then(([session, tracks]) => {
        this.session = session!;
        this.availableTracks = tracks || [];
        this.format = session!.formats?.[0] || null;
        this.category = session!.categories?.[0] || null;
        resolve();
      }).catch(err => {
        this.error = 'Failed to load session data';
        reject(err);
      });
    });
  }

  onEditSession(): void {
    this.isEditingSchedule = true;
    this.scheduleError = null;
    this.populateScheduleForm();
  }

  private populateScheduleForm(): void {
    if (!this.session || !this.scheduleForm) return;

    const formValues: any = {
      track: this.session.track || '',
      startDate: this.getStartDateValue(),
      startTime: this.getStartTimeValue()
    };

    if (this.session.start && this.session.end) {
      try {
        const startDate = new Date(this.session.start);
        const endDate = new Date(this.session.end);
        const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

        if (durationMinutes > 0) {
          formValues.duration = durationMinutes;
          this.selectedDuration = durationMinutes;
        }
      } catch (error) {
        console.warn('Error calculating duration:', error);
        formValues.duration = 60;
        this.selectedDuration = 60;
      }
    } else {
      formValues.duration = 60;
      this.selectedDuration = 60;
    }

    this.scheduleForm.patchValue(formValues);
  }

  getTrackPlaceholder(): string {
    return this.session?.track || 'Enter room or track name';
  }

  getStartTimeValue(): string {
    if (this.session?.start) {
      try {
        return this.formatTimeForInput(new Date(this.session.start));
      } catch (error) {
        console.warn('Error formatting start time:', error);
        return '';
      }
    }
    return '';
  }

  getStartDateValue(): string {
    if (this.session?.start) {
      try {
        return this.formatDateForInput(new Date(this.session.start));
      } catch (error) {
        console.warn('Error formatting start date:', error);
        return '';
      }
    }
    return '';
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
    this.selectedDuration = duration;
    this.scheduleForm.patchValue({ duration: duration });
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

  onSaveSchedule(): void {
    if (!this.scheduleForm || this.scheduleForm.invalid || this.isUpdatingSchedule) {
      return;
    }

    const formValues = this.scheduleForm.value;
    const startDate = this.combineDateAndTime(formValues.startDate, formValues.startTime);

    if (!startDate) {
      this.scheduleError = 'Please provide a valid start date and time';
      return;
    }

    const endDate = this.calculateEndDate(startDate, formValues.duration);

    const scheduleUpdate: SessionScheduleUpdate = {
      start: startDate,
      end: endDate,
      track: formValues.track?.trim() || undefined
    };

    this.isUpdatingSchedule = true;
    this.scheduleError = null;

    this.sessionService.updateSessionSchedule(this.eventId, this.sessionId, scheduleUpdate)
      .pipe(
        finalize(() => this.isUpdatingSchedule = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (updatedSession) => {
          this.session = updatedSession;
          this.isEditingSchedule = false;
          this.scheduleError = null;
        },
        error: (error) => {
          console.error('Error updating session schedule:', error);
          this.scheduleError = error.error?.message || 'Failed to update session schedule';
        }
      });
  }

  onCancelScheduleEdit(): void {
    this.isEditingSchedule = false;
    this.scheduleError = null;
    if (this.scheduleForm) {
      this.scheduleForm.reset();
    }
  }

  get scheduleFormErrors(): string[] {
    if (!this.scheduleForm) return [];

    const errors: string[] = [];

    if (this.scheduleForm.hasError('invalidDuration')) {
      errors.push('Duration must be positive');
    }

    const trackControl = this.scheduleForm.get('track');
    if (trackControl?.hasError('maxlength')) {
      errors.push('Track name must be less than 50 characters');
    }

    return errors;
  }

  hasScheduleInfo(): boolean {
    return !!(this.session?.start || this.session?.track);
  }

  formatCompleteSessionInfo(): string {
    if (!this.session) return '';

    const parts: string[] = [];

    if (this.session.start) {
      try {
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        };

        const dateStr = this.session.start.toLocaleDateString('en-US', options);
        const timeStr: string = this.session.start.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        parts.push(`<strong class="font-medium"> ${dateStr} </strong> at <strong class="font-medium">${timeStr}</strong>`);
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }

    if (this.session.track) {
      parts.push(`in room <strong class="font-medium">${this.getTrackName()}</strong>`);
    }

    return parts.join(' ');
  }

  getTrackName(): string {
    if (!this.session?.track) return '';

    if (this.session.track.includes(' ')) {
      return this.session.track;
    }

    return this.session.track
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  formatLevel(level: string): string {
    if (!level) return '';
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  }

  formatLanguage(languageCode: string): string {
    if (!languageCode) return '';

    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
      const languageName: string | undefined = displayNames.of(languageCode.toLowerCase());

      return languageName ?
        languageName.charAt(0).toUpperCase() + languageName.slice(1) :
        languageCode.toUpperCase();

    } catch (error) {
      console.warn(`Unable to format language code: ${languageCode}`, error);
      return languageCode.toUpperCase();
    }
  }

  openItemDetail(speakerId: string): void {
    this.router.navigate(['event', this.eventId, 'speaker', speakerId]);
  }
}
