import {Component, OnInit} from '@angular/core';
import {
  ButtonGreenActionsComponent
} from '../../../../../../shared/button-green-actions/button-green-actions.component';
import {ButtonGreyComponent} from '../../../../../../shared/button-grey/button-grey.component';
import {InputComponent} from '../../../../../../shared/input/input.component';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {FormField} from '../../../../../../shared/input/interface/form-field';
import {Router} from '@angular/router';
import {EventDataService} from '../../../../services/event/event-data.service';
import {EventService} from '../../../../services/event/event.service';
import {Event} from '../../../../type/event/event';

@Component({
  selector: 'app-information-event',
  standalone: true,
  imports: [
    ButtonGreenActionsComponent,
    ButtonGreyComponent,
    ReactiveFormsModule,
    FormsModule,
    InputComponent
  ],
  templateUrl: './information-event.component.html',
  styleUrl: './information-event.component.scss'
})
export class InformationEventComponent implements OnInit {
  isSubmitted: boolean = false;
  form!: FormGroup;
  eventId: string = '';
  eventName: string = '';
  eventData: Partial<Event> = {};

  constructor(
    private fb: FormBuilder,
    private eventDataService: EventDataService,
    private eventService: EventService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.eventDataService.eventId$.subscribe(id => {
      this.eventId = id;
    });

    this.eventDataService.eventName$.subscribe(name => {
      this.eventName = name;
    });

    this.eventDataService.eventData$.subscribe(data => {
      this.eventData = data;

      if (data.startDate) {
        this.form.get('startDate')?.setValue(this.formatDateForInput(data.startDate));
      }
      if (data.endDate) {
        this.form.get('endDate')?.setValue(this.formatDateForInput(data.endDate));
      }
      if (data.isOnline !== undefined) {
        this.form.get('isOnline')?.setValue(data.isOnline);
      }
      if (data.location) {
        this.form.get('venueLocation')?.setValue(data.location);
      }
      if (data.description) {
        this.form.get('description')?.setValue(data.description);
      }
    });
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      isOnline: [false],
      venueLocation: [''],
      description: ['']
    });

    this.form.get('isOnline')?.valueChanges.subscribe(isOnline => {
      const venueLocationControl = this.form.get('venueLocation');
      if (!isOnline) {
        venueLocationControl?.setValidators([Validators.required]);
      } else {
        venueLocationControl?.clearValidators();
      }
      venueLocationControl?.updateValueAndValidity();
    });
  }

  private formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onSubmit(): void {
    this.isSubmitted = true;

    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const secondStepData: Partial<Event> = {
      startDate: this.form.value.startDate ? new Date(this.form.value.startDate) : null,
      endDate: this.form.value.endDate ? new Date(this.form.value.endDate) : null,
      isOnline: this.form.value.isOnline || false,
      location: this.form.value.venueLocation || '',
      description: this.form.value.description || ''
    };

    if (this.eventId) {
      this.eventService.updateEvent({
        idEvent: this.eventId,
        ...secondStepData
      }).subscribe({
        next: () => {
          this.router.navigate(['/events']);
        },
        error: (error) => {
          console.error('Error updating event', error);
          alert('Failed to update event: ' + (error.message || 'Unknown error'));
        }
      });
    } else {
      const completeEventData: Event = {
        ...this.eventData as Event,
        ...secondStepData,
        eventName: this.eventName || 'Unnamed Event'
      };

      this.eventService.createEvent(completeEventData).subscribe({
        next: (response) => {
          this.router.navigate(['/events']);
        },
        error: (error) => {
          console.error('Error creating complete event', error);
          alert('Failed to create event: ' + (error.message || 'Unknown error'));
        }
      });
    }
  }

  getFormControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  validateDates(): boolean {
    const startDate = this.form.value.startDate ? new Date(this.form.value.startDate) : null;
    const endDate = this.form.value.endDate ? new Date(this.form.value.endDate) : null;

    if (startDate && endDate && startDate > endDate) {
      this.form.get('endDate')?.setErrors({'endBeforeStart': true});
      return false;
    }

    return true;
  }

  formFields: FormField[] = [
    {
      name: 'startDate',
      label: 'Start date',
      type: 'date',
      required: true,
    },
    {
      name: 'endDate',
      label: 'End date',
      type: 'date',
      required: true,
    }
  ];

  additionalFields: FormField[] = [
    {name: 'venueLocation', label: 'Venue location (address, city, country)', type: 'text'},
    {name: 'description', label: 'Description', type: 'textarea'}
  ];
}
