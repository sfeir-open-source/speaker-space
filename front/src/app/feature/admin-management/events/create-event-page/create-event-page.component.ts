import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ButtonGreenActionsComponent} from '../../../../shared/button-green-actions/button-green-actions.component';
import {InputComponent} from '../../../../shared/input/input.component';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Event} from '../../type/event';
import {FormField} from '../../../../shared/input/interface/form-field';
import {ButtonGreyComponent} from '../../../../shared/button-grey/button-grey.component';
import {EventService} from '../../services/event/event.service';

@Component({
  selector: 'app-create-event-page',
  standalone: true,
  imports: [CommonModule, ButtonGreenActionsComponent, InputComponent, ReactiveFormsModule, ButtonGreyComponent],
  templateUrl: './create-event-page.component.html',
  styleUrl: './create-event-page.component.scss'
})
export class CreateEventPageComponent implements OnInit {
  eventUrl: string = '';
  event: Event[] = [];

  constructor(private fb: FormBuilder, private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      url: [{value: this._baseUrl, disabled: true}]
    });
  }


  ngOnInit(): void {
    this.eventUrl = this.route.snapshot.paramMap.get('eventUrl') || '';
    this.form.get('name')?.valueChanges.subscribe(value => {
      if (value) {
        const urlSuffix = value.trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-');

        this.form.get('url')?.setValue(this._baseUrl + urlSuffix);
      } else {
        this.form.get('url')?.setValue(this._baseUrl);
      }
    });
  }

  form: FormGroup;
  private _router = inject(Router);
  private _eventService = inject(EventService);
  private _baseUrl: string = 'https://speaker-space.io/event/';

  isSubmitted: boolean = false;

  formFields: FormField[] = [
    {
      name: 'name',
      label: 'Name',
      placeholder: 'Enter your event name',
      type: 'text',
      required: true,
    },
    {
      name: 'url',
      label: 'Event URL',
      placeholder: 'https://speaker-space.io/event/',
      type: 'text',
      required: false,
      disabled: true,
    },
    {
      name: 'urlConferenceHall',
      label: 'Conference Hall Url Connexion',
      placeholder: '',
      type: 'text',
      required: false,
    }
  ];

  additionalFields: FormField[] = [
    {
      name: 'timeZone',
      label: 'Event timezone',
      placeholder: '(GMT+01:00) Central European Time - Europe/Paris',
      type: 'text',
      required: true,
    }
  ]

  onSubmit(): void {
    this.isSubmitted = true;

    if (this.form.invalid) {
      return;
    }

    const event: Event = {
      eventName: this.form.value.name || '',
      url: this.form.get('url')?.value || ''
    };

    this._eventService.createEvent(event).subscribe({
      next: response => {
        const navigationTarget = response.url ?? response.idEvent ?? '';
        this._router.navigate(['/event', navigationTarget]);
      },
      error: error => {
        console.error('Error creating event', error);
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

}
