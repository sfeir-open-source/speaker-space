import {Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import moment from 'moment';
import 'moment-timezone';
import {TimezoneOption} from '../../../../../type/event/time-zone-option';
import {Team} from '../../../../../type/team/team';
import {TeamService} from '../../../../../services/team/team.service';
import {EventService} from '../../../../../services/event/event.service';
import {EventDataService} from '../../../../../services/event/event-data.service';
import {FormField} from '../../../../../../../shared/input/interface/form-field';
import {
  ButtonGreenActionsComponent
} from '../../../../../../../shared/button-green-actions/button-green-actions.component';
import {InputComponent} from '../../../../../../../shared/input/input.component';
import {EventDTO} from '../../../../../type/event/eventDTO';
import {ButtonGreyComponent} from '../../../../../../../shared/button-grey/button-grey.component';
import {environment} from '../../../../../../../../environments/environment.development';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-general-info-event',
  standalone: true,
  imports: [CommonModule, ButtonGreenActionsComponent, InputComponent, ReactiveFormsModule, ButtonGreyComponent, FormsModule],
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
  visibility: 'private' | 'public' = 'private';

  timezoneSelector = new FormControl('Europe/Paris');
  timezoneOptions: TimezoneOption[] = [];
  teams: Team[] = [];

private _teamService = inject(TeamService);
private _eventDataService = inject(EventDataService);
private _route = inject(ActivatedRoute);

private subscriptions: Subscription = new Subscription();

  constructor(private fb: FormBuilder) {
    this.initializeForm();
    this.prepareTimezoneOptions();
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.setupFormListeners();

    if (this.initialData && this.mode === 'edit') {
    this.loadInitialData(this.initialData);
  }

  this.visibility = this.initialVisibility;

  this.updateLocalTime(this.timezoneSelector.value || 'Europe/Paris');
}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

private initializeForm(): void {
    const baseFormConfig = {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      url: [{ value: `${environment.baseUrl}/event/`, disabled: true }],
      urlConferenceHall: [''],
      teamId: [''],
      timeZone: [this.timezoneSelector.value, Validators.required]
    };

    if (this.mode === 'edit') {
    this.form = this.fb.group({
      ...baseFormConfig,
      eventName: ['', Validators.required],
      eventURL: [{ value: '', disabled: true }]
    });
  } else {
    this.form = this.fb.group(baseFormConfig);
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
        const urlSuffix = this.formatUrlFromName(name || '');
        this.form.get('url')?.setValue(`${environment.baseUrl}/event/` + urlSuffix);
        this._eventDataService.setEventName(name || '');
      }) || new Subscription()
    );
  }

  if (this.mode === 'edit') {
    this.subscriptions.add(
      this.form.get('eventName')?.valueChanges.subscribe(name => {
        if (name) {
          const urlSuffix = this.formatUrlFromName(name);
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

private loadInitialData(data: Partial<EventDTO>): void {
    if (this.mode === 'edit') {
    this.form.patchValue({
      eventName: data.eventName || '',
      eventURL: data.url ? `${environment.baseUrl}/event/${data.url}` : '',
      urlConferenceHall: data.conferenceHallUrl || '',
      timeZone: data.timeZone || 'Europe/Paris'
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
    this.isSubmitted = true;

    if (this.form.invalid) {
    console.warn('Form invalid:', this.form.errors);
    return;
  }

  const formValue = this.form.getRawValue();

  if (this.mode === 'create') {
    const newEvent: EventDTO = {
      eventName: formValue.name,
      url: formValue.url,
      conferenceHallUrl: formValue.urlConferenceHall,
      timeZone: formValue.timeZone,
      teamId: formValue.teamId || this.teamId
    };

    this.formSubmitted.emit(newEvent);
  } else {
    const updatedEvent = {
      eventName: formValue.eventName,
      url: formValue.eventURL?.replace(`${environment.baseUrl}/event/`, '') || '',
      conferenceHallUrl: formValue.urlConferenceHall,
      timeZone: formValue.timeZone,
      visibility: this.visibility
    };

    this.formSubmitted.emit(updatedEvent);
  }
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
    const offsetFormatted = moment.tz(tz.name).format('Z');
    return `(GMT${offsetFormatted}) ${tz.name}`;
  }

  getFormControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
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
          label: 'Conference Hall Url Connexion',
          paragraph: 'Use a conference hall existing URL if you want to synchronize conference Hall Datas',
          type: 'text',
          required: false,
        }
      ];
    } else {
      return [
        {
          name: 'eventName',
          label: 'Event name',
          placeholder: '',
          type: 'text',
          required: true,
        },
        {
          name: 'eventURL',
          label: 'Event URL',
          placeholder: '',
          type: 'text',
          required: false,
          disabled: true,
        },
        {
          name: 'urlConferenceHall',
          label: 'Conference Hall Url Connexion',
          paragraph: 'Use a conference hall existing URL if you want to synchronize conference Hall Datas',
          type: 'text',
          required: false,
        }
      ];
    }
  }
}
