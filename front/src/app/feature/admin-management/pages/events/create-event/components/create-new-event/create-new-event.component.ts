import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-create-new-event',
  standalone: true,
  imports: [CommonModule, ButtonGreenActionsComponent, InputComponent, ReactiveFormsModule, ButtonGreyComponent],
  templateUrl: './create-new-event.component.html',
  styleUrl: './create-new-event.component.scss'
})
export class CreateNewEventComponent implements OnInit {
  eventUrl: string = '';
  teamId: string | null = null;
  form: FormGroup;
  isSubmitted: boolean = false;
  dateTimeUtc = moment.utc();
  dateTimeLocal: moment.Moment | null = null;

  timezoneSelector = new FormControl('Europe/Paris');
  timezoneOptions: TimezoneOption[] = [];
  teams: Team[] = [];

  private _router = inject(Router);
  private _teamService = inject(TeamService);
  private _eventService = inject(EventService);
  private _eventDataService = inject(EventDataService);
  private _route = inject(ActivatedRoute);

  formFields: FormField[] = [
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

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      url: [{ value: `${environment.baseUrl}/event/`, disabled: true }],
      urlConferenceHall: [''],
      teamId: [''],
      timeZone: [this.timezoneSelector.value, Validators.required]
    });

    this.prepareTimezoneOptions();
  }

  ngOnInit(): void {
    this._teamService.teams$.subscribe(teams => this.teams = teams);

    this._route.paramMap.subscribe(params => {
      const param: string|null = params.get('eventUrl') || params.get('teamId');

      if (param) {
        if (param.includes('team-') || /^[a-zA-Z0-9]{20,}$/.test(param)) {
          this.teamId = param;
          this.form.get('teamId')?.setValue(param);
        } else {
          this.eventUrl = param;
        }
      }
    });

    this.eventUrl = this._route.snapshot.paramMap.get('eventUrl') || '';

    this.form.get('name')?.valueChanges.subscribe(name => {
      const urlSuffix: any = name?.trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-') || '';
      this.form.get('url')?.setValue(`${environment.baseUrl}/event/` + urlSuffix);
      this._eventDataService.setEventName(name || '');
    });

    this.timezoneSelector.valueChanges.subscribe(timezone => {
      this.updateLocalTime(timezone || 'Europe/Paris');
      this.form.get('timeZone')?.setValue(timezone);
    });

    this.updateLocalTime(this.timezoneSelector.value || 'Europe/Paris');
  }

  onSubmit(): void {
    this.isSubmitted = true;

    if (this.form.invalid) {
      console.warn('Form invalid:', this.form.errors);
      return;
    }

    const formValue: any = this.form.getRawValue();
    const newEvent: EventDTO = {
      eventName: formValue.name,
      url: formValue.url,
      conferenceHallUrl: formValue.urlConferenceHall,
      timeZone: formValue.timeZone,
      teamId: formValue.teamId || this.teamId
    };

    this._eventService.createEvent(newEvent).subscribe({
      next: (response : EventDTO) => {
        this._eventDataService.setEventId(response.idEvent || '');
        this._eventDataService.updateEventData({
          conferenceHallUrl: response.conferenceHallUrl,
          url: response.url,
          teamId: response.teamId
        });
        this._eventDataService.goToNextStep();
      },
      error: (err) => {
        alert('Failed to create event: ' + (err.message || 'Unknown error'));
      }
    });
  }

  goBack(): void {
    this._router.navigate(this.eventUrl ? ['/event', this.eventUrl] : ['/events']);
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
}
