import {Component, HostListener, inject, Input, OnInit} from '@angular/core';
import {ButtonGreenActionsComponent} from '../../../../../shared/button-green-actions/button-green-actions.component';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {NavbarSessionPageComponent} from '../navbar-session-page/navbar-session-page.component';
import {BaseDetailComponent} from '../../class/base-detail-component';
import {Category, Format, SessionImportData} from '../../../type/session/session';
import {SessionService} from '../../../services/sessions/session.service';
import {UserRoleService} from '../../../../../core/services/user-services/user-role.service';
import {UserContextService} from '../../../../../core/services/user-services/user-context.service';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {finalize, of} from 'rxjs';
import {SessionScheduleUpdate} from '../../../type/session/schedule-json-data';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  NavbarSpeakerSectionComponent
} from '../../../../speaker-section/components/navbar-speaker-section/navbar-speaker-section.component';
import {SessionFormatService} from '../../../services/sessions/session-format.service';

@Component({
  selector: 'app-session-detail-unified',
  imports: [
    ButtonGreenActionsComponent,
    ButtonGreyComponent,
    ReactiveFormsModule,
    NavbarSpeakerSectionComponent,
    NavbarSessionPageComponent
  ],
  templateUrl: './session-detail-unified.component.html',
  styleUrl: './session-detail-unified.component.scss'
})
export class SessionDetailUnifiedComponent extends BaseDetailComponent implements OnInit {
  @Input() userRole: 'admin' | 'speaker' = 'admin';

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

  private readonly sessionService = inject(SessionService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly userContextService = inject(UserContextService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly sessionFormatService = inject(SessionFormatService);

  constructor(
    route: ActivatedRoute,
    eventService: EventService
  ) {
    super(route, eventService);
  }

  override async ngOnInit(): Promise<void> {
    await this.determineUserRole();
    super.ngOnInit();
    this.initializeScheduleForm();
  }

  private async determineUserRole(): Promise<void> {
    try {
      const eventId : string = this.route.snapshot.paramMap.get('eventId') || '';
      if (eventId) {
        this.userRole = await this.userRoleService.getUserRoleForEvent(eventId);
      }
    } catch (error) {
      console.warn('Error determining user role, defaulting to admin:', error);
      this.userRole = 'admin';
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
      const sessionObservable = this.userRole === 'speaker'
        ? this.userContextService.getMySessionById(this.eventId, this.sessionId)
        : this.sessionService.getSessionById(this.eventId, this.sessionId);

      const tracksObservable = this.userRole === 'admin'
        ? this.sessionService.getAvailableTracksForEvent(this.eventId)
        : of([]);

      Promise.all([
        sessionObservable.toPromise(),
        tracksObservable.toPromise()
      ]).then(([session, tracks]) => {
        this.session = session!;
        this.availableTracks = tracks || [];
        this.format = session!.formats?.[0] || null;
        this.category = session!.categories?.[0] || null;
        resolve();
      }).catch(err => {
        console.error('Error loading session data:', err);
        this.error = this.userRole === 'speaker'
          ? 'Failed to load your session. Please check if you have access to this session.'
          : 'Failed to load session data. Please check if the session exists.';
        reject(err);
      });
    });
  }

  onEditSession(): void {
    if (this.userRole === 'admin') {
      this.isEditingSchedule = true;
      this.scheduleError = null;
      this.populateScheduleForm();
    }
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

  getStartTimeValue(): string {
    if (this.session?.start) {
      try {
        return this.sessionFormatService.formatTimeForInput(new Date(this.session.start));
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
        return this.sessionFormatService.formatDateForInput(new Date(this.session.start));
      } catch (error) {
        console.warn('Error formatting start date:', error);
        return '';
      }
    }
    return '';
  }

  hasScheduleInfo(): boolean {
    return !!(this.session?.start || this.session?.track);
  }

  formatCompleteSessionInfo(): string {
    if (!this.session) return '';

    return this.sessionFormatService.formatCompleteScheduleInfo(
      this.session.start,
      this.session.track,
      {
        includeHtml: true,
        trackPrefix: 'in room'
      }
    );
  }

  formatLevel(level: string): string {
    return this.sessionFormatService.formatLevel(level);
  }

  formatLanguage(languageCode: string): string {
    return this.sessionFormatService.formatLanguage(languageCode);
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
    if (!this.scheduleForm || this.scheduleForm.invalid || this.isUpdatingSchedule || this.userRole !== 'admin') {
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
        takeUntilDestroyed(this._destroyRef),
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

  openSpeakerDetail(speakerId: string): void {
    if (speakerId) {
      if (this.userRole === 'admin') {
        this.router.navigate(['event', this.eventId, 'speaker', speakerId]);
      }
    }
  }
}
