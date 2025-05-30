import {Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import moment from 'moment';
import 'moment-timezone';
import {BehaviorSubject, debounceTime, Subject, Subscription} from 'rxjs';
import {EventDTO} from '../../../type/event/eventDTO';
import {ButtonGreenActionsComponent} from '../../../../../shared/button-green-actions/button-green-actions.component';
import {InputComponent} from '../../../../../shared/input/input.component';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {TimezoneOption} from '../../../type/event/time-zone-option';
import {Team} from '../../../type/team/team';
import {TeamService} from '../../../services/team/team.service';
import {EventDataService} from '../../../services/event/event-data.service';
import {environment} from '../../../../../../environments/environment.development';
import {FormField} from '../../../../../shared/input/interface/form-field';
import {SaveStatus} from '../../../../../core/types/save-status.types';
import {AutoSaveService} from '../../services/auto-save.service';
import {EventService} from '../../../services/event/event.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SaveIndicatorComponent} from '../../../../../core/save-indicator/save-indicator.component';

@Component({
  selector: 'app-general-info-event',
  standalone: true,
  imports: [CommonModule, ButtonGreenActionsComponent, InputComponent, ReactiveFormsModule, ButtonGreyComponent, FormsModule, SaveIndicatorComponent],
  templateUrl: './general-info-event.component.html',
  styleUrl: './general-info-event.component.scss'
})
export class GeneralInfoEventComponent implements OnInit, OnDestroy {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() initialData: Partial<EventDTO> | null = null;
  @Input() initialVisibility: 'private' | 'public' = 'private';

  @Output() formSubmitted = new EventEmitter<any>();
  @Output() goBack = new EventEmitter<void>();

  eventUrl: string = '';
  teamId: string | null = null;
  form!: FormGroup;
  isSubmitted: boolean = false;
  dateTimeUtc = moment.utc();
  dateTimeLocal: moment.Moment | null = null;

  timezoneSelector = new FormControl('Europe/Paris');
  timezoneOptions: TimezoneOption[] = [];
  teams: Team[] = [];
  saveStatus$ = new BehaviorSubject<SaveStatus>('idle');

  private _teamService = inject(TeamService);
  private _eventDataService = inject(EventDataService);
  private _route = inject(ActivatedRoute);
  private autoSaveDestroy$ = new Subject<void>();
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private autoSaveService: AutoSaveService,
    private eventService: EventService,
    private snackBar: MatSnackBar
  ) {
    this.prepareTimezoneOptions();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupSubscriptions();
    this.setupFormListeners();

    if (this.initialData && this.mode === 'edit') {
      this.loadInitialData(this.initialData);
      this.setupAutoSave();
    }

    this.updateLocalTime(this.timezoneSelector.value || 'Europe/Paris');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.autoSaveDestroy$.next();
    this.autoSaveDestroy$.complete();
  }

  private setupAutoSave(): void {
    if (this.mode !== 'edit' || !this.initialData?.idEvent) {
      return;
    }

    const { saveStatus$, destroy$ } = this.autoSaveService.setupAutoSave<EventDTO>(
      this.form,
      (data: Partial<EventDTO>) => this.eventService.updateEvent(data),
      {
        extractValidFields: () => this.extractValidEventData(),
        onSaveStart: () => {
          this.form.markAsPristine();
        },
        onSaveSuccess: (result: EventDTO) => {
          console.log('Event auto-saved successfully:', result);
        },
        onSaveError: (error: any) => {
          console.error('Auto-save failed:', error);
          this.snackBar.open('Erreur lors de la sauvegarde automatique', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.form.markAsDirty();
        },
        debounceTime: 2000
      }
    );

    this.saveStatus$ = saveStatus$ as BehaviorSubject<SaveStatus>;
    this.autoSaveDestroy$ = destroy$;
    this.subscriptions.add(
      this.timezoneSelector.valueChanges.pipe(
        debounceTime(500)
      ).subscribe(timezone => {
        this.updateLocalTime(timezone || 'Europe/Paris');
        this.form.get('timeZone')?.setValue(timezone);

        if (this.mode === 'edit' && timezone !== this.initialData?.timeZone) {
          this.form.markAsDirty();
        }
      })
    );
  }

  private initializeForm(): void {
    if (this.mode === 'edit') {
      this.form = this.fb.group({
        eventName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        eventURL: [{ value: '', disabled: true }],
        urlConferenceHall: [''],
        timeZone: [this.timezoneSelector.value, Validators.required],
        visibility: [this.initialVisibility]
      });
    } else {
      this.form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        url: [{ value: `${environment.baseUrl}/event/`, disabled: true }],
        urlConferenceHall: [''],
        teamId: [''],
        timeZone: [this.timezoneSelector.value, Validators.required]
      });
    }
  }

  private setupSubscriptions(): void {
    this.subscriptions.add(
      this._teamService.teams$.subscribe(teams => this.teams = teams)
    );

    if (this.mode === 'create') {
      this.subscriptions.add(
        this._route.paramMap.subscribe(params => {
          const param: string | null = params.get('eventUrl') || params.get('teamId');

          if (param) {
            if (param.includes('team-') || /^[a-zA-Z0-9]{20,}$/.test(param)) {
              this.teamId = param;
              this.form.get('teamId')?.setValue(param);
            } else {
              this.eventUrl = param;
            }
          }
        })
      );

      this.eventUrl = this._route.snapshot.paramMap.get('eventUrl') || '';
    }
  }

  private setupFormListeners(): void {
    if (this.mode === 'create') {
      this.subscriptions.add(
        this.form.get('name')?.valueChanges.subscribe(name => {
          const urlSuffix: string = this.formatUrlFromName(name || '');
          this.form.get('url')?.setValue(`${environment.baseUrl}/event/` + urlSuffix);
          this._eventDataService.setEventName(name || '');
        }) || new Subscription()
      );
    } else {
      this.subscriptions.add(
        this.form.get('eventName')?.valueChanges.subscribe(name => {
          if (name) {
            const urlSuffix: string = this.formatUrlFromName(name);
            this.form.get('eventURL')?.setValue(`${environment.baseUrl}/event/` + urlSuffix);
          } else {
            this.form.get('eventURL')?.setValue(`${environment.baseUrl}/event/`);
          }
        }) || new Subscription()
      );
    }
    this.subscriptions.add(
      this.timezoneSelector.valueChanges.subscribe(timezone => {
        this.updateLocalTime(timezone || 'Europe/Paris');
        this.form.get('timeZone')?.setValue(timezone);
      })
    );
  }

  private extractValidEventData(): Partial<EventDTO> {
    const formValue = this.form.getRawValue();

    const data: Partial<EventDTO> = {
      idEvent: this.initialData?.idEvent
    };

    if (formValue.eventName !== undefined && formValue.eventName !== this.initialData?.eventName) {
      data.eventName = formValue.eventName;
    }

    if (formValue.urlConferenceHall !== undefined && formValue.urlConferenceHall !== this.initialData?.conferenceHallUrl) {
      data.conferenceHallUrl = formValue.urlConferenceHall;
    }

    if (formValue.timeZone !== undefined && formValue.timeZone !== this.initialData?.timeZone) {
      data.timeZone = formValue.timeZone;
    }

    const currentIsPrivate = formValue.visibility === 'private';
    const initialIsPrivate = this.initialData?.isPrivate;

    if (currentIsPrivate !== initialIsPrivate) {
      data.isPrivate = currentIsPrivate;
    }

    return data;
  }

  private loadInitialData(data: Partial<EventDTO>): void {
    if (this.mode === 'edit') {
      const fullUrl: string = data.url ?
        (data.url.startsWith('http') ? data.url : `${environment.baseUrl}/event/${data.url}`)
        : '';

      const visibility = data.isPrivate ? 'private' : 'public';

      this.form.patchValue({
        eventName: data.eventName || '',
        eventURL: fullUrl,
        urlConferenceHall: data.conferenceHallUrl || '',
        timeZone: data.timeZone || 'Europe/Paris',
        visibility: visibility
      });

      if (data.timeZone) {
        this.timezoneSelector.setValue(data.timeZone);
      }
    }
  }

  private formatUrlFromName(name: string): string {
    return name.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  onSubmit(): void {
    if (this.mode === 'edit') {
      return;
    }

    this.isSubmitted = true;

    if (this.form.invalid) {
      console.warn('Form invalid:', this.form.errors);
      return;
    }

    const formValue = this.form.getRawValue();
    const newEvent: EventDTO = {
      eventName: formValue.name,
      url: formValue.url,
      isOnline: formValue.isOnline,
      conferenceHallUrl: formValue.urlConferenceHall,
      timeZone: formValue.timeZone,
      teamId: formValue.teamId || this.teamId,
      teamUrl: formValue.teamUrl,
      isPrivate: true,
    };

    this.formSubmitted.emit(newEvent);
  }


  get showAutoSaveIndicator(): boolean {
    return this.mode === 'edit';
  }

  onGoBack(): void {
    this.goBack.emit();
  }

  prepareTimezoneOptions(): void {
    this.timezoneOptions = moment.tz.names().map(tz => ({
      name: tz,
      offset: moment.tz(tz).utcOffset()
    })).sort((a, b) => a.offset - b.offset);
  }

  updateLocalTime(timezone: string): void {
    this.dateTimeLocal = this.dateTimeUtc.clone().tz(timezone);
  }

  formatTimezoneOption(tz: TimezoneOption): string {
    const offsetFormatted: string = moment.tz(tz.name).format('Z');
    return `(GMT${offsetFormatted}) ${tz.name}`;
  }

  getFormControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  get visibility(): 'private' | 'public' {
    return this.form.get('visibility')?.value || 'private';
  }

  get showGoBackButton(): boolean {
    return this.mode === 'create';
  }

  get showVisibilitySection(): boolean {
    return this.mode === 'edit';
  }

  get submitButtonText(): string {
    return this.mode === 'create' ? 'Continue' : 'Update event';
  }

  get submitButtonIcon(): string {
    return this.mode === 'create' ? 'arrow_forward' : 'save';
  }

  get formFields(): FormField[] {
    if (this.mode === 'create') {
      return [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your event name'
        },
        {
          name: 'url',
          label: 'Event URL',
          placeholder: 'https://speaker-space.io/event/',
          type: 'text',
          required: true,
          disabled: true,
        },
        {
          name: 'urlConferenceHall',
          label: 'Conference Hall URL Connection',
          paragraph: 'Use a conference hall existing URL if you want to synchronize conference Hall data',
          type: 'text',
          required: false,
          placeholder: 'https://conference-hall.io/...'
        }
      ];
    } else {
      return [
        {
          name: 'eventName',
          label: 'Name',
          placeholder: 'Enter your event name',
          type: 'text',
          required: true,
        },
        {
          name: 'eventURL',
          label: 'Event URL',
          placeholder: 'https://speaker-space.io/event/',
          type: 'text',
          required: false,
          disabled: true,
        },
        {
          name: 'urlConferenceHall',
          label: 'Conference Hall URL Connection',
          paragraph: 'Use a conference hall existing URL if you want to synchronize conference Hall data',
          type: 'text',
          required: false,
          placeholder: 'https://conference-hall.io/...'
        }
      ];
    }
  }
}
