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
import {TeamService} from '../../../../services/team/team.service';
import {EventDTO} from '../../../../type/event/eventDTO';

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
  teamId: string | null = null;
  teamUrl: string | null = null;
  eventName: string = '';
  currentEvent: EventDTO = {} as EventDTO;

  constructor(
    private fb: FormBuilder,
    private eventDataService: EventDataService,
    private eventService: EventService,
    private router: Router,
    private teamService: TeamService
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

    this.eventDataService.event$.subscribe(event => {
      this.currentEvent = event;

      if (event.teamId) {
        this.teamId = event.teamId;
        this.teamService.getTeamById(event.teamId).subscribe(team => {
          if (team && team.url) {
            this.teamUrl = team.url.split('/').pop() || null;
          }
        });
      }

      if (event.startDate) {
        this.form.get('startDate')?.setValue(this.formatDateForInput(event.startDate));
      }
      if (event.endDate) {
        this.form.get('endDate')?.setValue(this.formatDateForInput(event.endDate));
      }
      if (event.isOnline !== undefined) {
        this.form.get('isOnline')?.setValue(event.isOnline);
      }
      if (event.location) {
        this.form.get('venueLocation')?.setValue(event.location);
      }
      if (event.description) {
        this.form.get('description')?.setValue(event.description);
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

  async onSubmit() {
    this.isSubmitted = true;

    if (this.form.invalid) {
      return;
    }

    if (!this.validateDates()) {
      return;
    }

    const formValues = this.form.value;

    const startDate = formValues.startDate ? new Date(formValues.startDate).toISOString() : undefined;
    const endDate = formValues.endDate ? new Date(formValues.endDate).toISOString() : undefined;

    this.eventDataService.updateEventData({
      startDate: startDate,
      endDate: endDate,
      location: formValues.venueLocation,
      description: formValues.description,
      isOnline: formValues.isOnline
    });

    const updatedEvent = this.eventDataService.getCurrentEvent();

    if (!updatedEvent.idEvent) {
      console.error("Event ID is missing");
      return;
    }

    this.eventService.updateEvent(updatedEvent).subscribe({
      next: (response) => {
        console.log("Event updated successfully", response);

        if (this.teamUrl) {
          this.router.navigate(['/team', this.teamUrl]);
        } else if (this.teamId) {
          this.teamService.getTeamById(this.teamId).subscribe(team => {
            if (team && team.url) {
              const teamUrlSegment = team.url.split('/').pop();
              if (teamUrlSegment) {
                this.router.navigate(['/team', teamUrlSegment]);
              }
            }
          });
        }
      },
      error: (err) => {
        console.error("Error updating event:", err);
      }
    });
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
