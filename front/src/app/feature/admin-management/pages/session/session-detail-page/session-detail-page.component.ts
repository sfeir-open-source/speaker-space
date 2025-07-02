import {Component} from '@angular/core';
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

@Component({
    selector: 'app-session-detail-page',
  imports: [
    ButtonGreyComponent,
    NavbarSessionPageComponent,
    ReactiveFormsModule
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

  private initializeScheduleForm(): FormGroup {
    return this.fb.group({
      startDate: [''],
      startTime: [''],
      endDate: [''],
      endTime: [''],
      track: ['', [Validators.maxLength(50)]]
    }, {
      validators: [this.dateTimeValidator.bind(this)]
    });
  }

  private dateTimeValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('startDate')?.value;
    const startTime = control.get('startTime')?.value;
    const endDate = control.get('endDate')?.value;
    const endTime = control.get('endTime')?.value;

    if (!startDate || !startTime || !endDate || !endTime) {
      return null;
    }

    const start = this.combineDateAndTime(startDate, startTime);
    const end = this.combineDateAndTime(endDate, endTime);

    if (start && end && start >= end) {
      return { dateTimeInvalid: true };
    }

    return null;
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
      this.sessionService.getSessionById(this.eventId, this.sessionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (session: SessionImportData) => {
            this.session = session;
            this.format = session.formats?.[0] || null;
            this.category = session.categories?.[0] || null;
            resolve();
          },
          error: (err) => {
            console.error('Error loading session:', err);
            this.error = 'Failed to load session data';
            reject(err);
          }
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
      track: this.session.track || ''
    };

    if (this.session.start) {
      const startDate = new Date(this.session.start);
      formValues.startDate = this.formatDateForInput(startDate);
      formValues.startTime = this.formatTimeForInput(startDate);
    }

    if (this.session.end) {
      const endDate = new Date(this.session.end);
      formValues.endDate = this.formatDateForInput(endDate);
      formValues.endTime = this.formatTimeForInput(endDate);
    }

    this.scheduleForm.patchValue(formValues);
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatTimeForInput(date: Date): string {
    return date.toTimeString().slice(0, 5);
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
    const endDate = this.combineDateAndTime(formValues.endDate, formValues.endTime);

    if (startDate && endDate && startDate >= endDate) {
      this.scheduleError = 'Start time must be before end time';
      return;
    }

    const scheduleUpdate: SessionScheduleUpdate = {
      start: startDate || undefined,
      end: endDate || undefined,
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
