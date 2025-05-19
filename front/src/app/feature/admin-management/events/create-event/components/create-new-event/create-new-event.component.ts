import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonGreenActionsComponent } from '../../../../../../shared/button-green-actions/button-green-actions.component';
import { InputComponent } from '../../../../../../shared/input/input.component';
import { ButtonGreyComponent } from '../../../../../../shared/button-grey/button-grey.component';
import { FormField } from '../../../../../../shared/input/interface/form-field';
import moment from 'moment';
import 'moment-timezone';
import { TimezoneOption } from '../../../../type/event/time-zone-option';
import { EventService } from '../../../../services/event/event.service';
import { EventDataService } from '../../../../services/event/event-data.service';
import { Event } from '../../../../type/event/event';
import { TeamService } from '../../../../services/team/team.service';
import { Team } from '../../../../type/team/team';

@Component({
  selector: 'app-create-new-event',
  standalone: true,
  imports: [CommonModule, ButtonGreenActionsComponent, InputComponent, ReactiveFormsModule, ButtonGreyComponent],
  templateUrl: './create-new-event.component.html',
  styleUrl: './create-new-event.component.scss'
})
export class CreateNewEventComponent implements OnInit {
  eventUrl: string = '';
  event: Event[] = [];
  dateTimeUtc: moment.Moment;
  dateTimeLocal: moment.Moment | null = null;
  timezoneOptions: TimezoneOption[] = [];
  timezoneSelector = new FormControl('Europe/Paris');
  tzs: TimezoneOption[] = [];
  form: FormGroup;
  teams: Team[] = [];

  private _router = inject(Router);
  private _eventService = inject(EventService);
  private _teamService = inject(TeamService);
  private _baseUrl: string = 'https://speaker-space.io/event/';

  isSubmitted: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private eventDataService: EventDataService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      url: [{value: this._baseUrl, disabled: true}],
      urlConferenceHall: [''],
      teamId: [''],
      timeZone: [this.timezoneSelector.value, Validators.required]
    });
    this.dateTimeUtc = moment("2017-06-05T19:41:03Z").utc();
    this.prepareTimezoneOptions();
  }

  ngOnInit(): void {
    this._teamService.teams$.subscribe(teams => {
      this.teams = teams;
    });

    this.eventUrl = this.route.snapshot.paramMap.get('eventUrl') || '';
    this.form.get('name')?.valueChanges.subscribe(value => {
      if (value) {
        this.eventDataService.setEventName(value);

        const urlSuffix = value.trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-');

        this.form.get('url')?.setValue(this._baseUrl + urlSuffix);
      } else {
        this.form.get('url')?.setValue(this._baseUrl);
        this.eventDataService.setEventName('');
      }
    });

    this.timezoneSelector.valueChanges.subscribe(timezone => {
      if (timezone) {
        this.updateLocalTime(timezone);
        this.form.get('timeZone')?.setValue(timezone);
      }
    });

    this.form.get('timeZone')?.setValue(this.timezoneSelector.value);
    this.updateLocalTime(this.timezoneSelector.value as string);
    this.tzs = this.timezoneOptions;
  }

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

  onSubmit(): void {
    console.log('Form submitted');
    this.isSubmitted = true;

    if (this.form.invalid) {
      console.log('Form controls with errors:', Object.keys(this.form.controls)
        .filter(key => this.form.controls[key].errors)
        .map(key => ({ key, errors: this.form.controls[key].errors })));
      return;
    }

    const fullUrl = this.form.get('url')?.value || '';

    const event: Event = {
      eventName: this.form.value.name || '',
      url: fullUrl,
      conferenceHallUrl: this.form.value.urlConferenceHall || '',
      timeZone: this.form.value.timeZone || 'Europe/Paris'
    };

    console.log('Event object to send:', event);

    this._eventService.createEvent(event).subscribe({
      next: (response) => {
        console.log('Event created successfully:', response);
        this.eventDataService.setEventId(response.idEvent || '');
        this.eventDataService.updateEventData({
          conferenceHallUrl: response.conferenceHallUrl,
          url: response.url
        });
        this.eventDataService.goToNextStep();
      },
      error: (error) => {
        console.error('Error creating event', error);
        alert('Failed to create event: ' + (error.message || 'Unknown error'));
      }
    });
  }

  getFormControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  goBack(): void {
    if (this.eventUrl) {
      this._router.navigate(['/event', this.eventUrl]);
    } else {
      this._router.navigate(['/events']);
    }
  }

  prepareTimezoneOptions(): void {
    this.timezoneOptions = moment.tz.names()
      .map((tz: string) => ({
        name: tz,
        offset: moment.tz(tz).utcOffset()
      }))
      .sort((a: TimezoneOption, b: TimezoneOption) => a.offset - b.offset);
  }

  updateLocalTime(timezone: string): void {
    const timestamp: number = this.dateTimeUtc.unix();
    const offset: number = moment.tz(timezone).utcOffset() * 60;
    this.dateTimeLocal = moment.unix(timestamp + offset).utc();
  }

  formatTimezoneOption(tz: TimezoneOption): string {
    const timezone = tz.offset ? moment.tz(tz.name).format('Z') : '';
    return `(GMT${timezone}) ${tz.name}`;
  }
}
