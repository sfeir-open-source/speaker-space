import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ButtonGreenActionsComponent} from '../../../../../shared/button-green-actions/button-green-actions.component';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {InputComponent} from '../../../../../shared/input/input.component';
import {EventDTO} from '../../../type/event/eventDTO';
import {EventDataService} from '../../../services/event/event-data.service';
import {TeamService} from '../../../services/team/team.service';
import {FormField} from '../../../../../shared/input/interface/form-field';

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
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() initialData: Partial<EventDTO> | null = null;

  @Output() formSubmitted = new EventEmitter<any>();
  @Output() doItLater = new EventEmitter<void>();

  isSubmitted: boolean = false;
  form!: FormGroup;
  eventId: string = '';
  teamId: string | null = null;
  teamUrl: string | null = null;
  eventName: string = '';
  currentEvent: EventDTO = {} as EventDTO;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private eventDataService: EventDataService,
    private teamService: TeamService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupSubscriptions();

    if (this.initialData && this.mode === 'edit') {
      this.loadInitialData(this.initialData);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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

  private setupSubscriptions(): void {
    this.subscriptions.add(
      this.eventDataService.eventId$.subscribe(id => {
        this.eventId = id;
      })
    );

    this.subscriptions.add(
      this.eventDataService.eventName$.subscribe(name => {
        this.eventName = name;
      })
    );

    this.subscriptions.add(
      this.eventDataService.event$.subscribe(event => {
        this.currentEvent = event;
        this.loadEventData(event);
      })
    );
  }

  private loadInitialData(data: Partial<EventDTO>): void {
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
  }

  private loadEventData(event: EventDTO): void {
    if (event.teamId) {
      this.teamId = event.teamId;
      this.teamService.getTeamById(event.teamId).subscribe(team => {
        if (team?.url) {
          this.teamUrl = team.url.split('/').pop() || null;
        }
      });
    }
    this.loadInitialData(event);
  }

  private formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  async onSubmit(): Promise<void> {
    this.isSubmitted = true;

    if (this.form.invalid) {
      return;
    }

    if (!this.validateDates()) {
      return;
    }

    const formValues = this.form.value;
    const formData = {
      startDate: formValues.startDate ? new Date(formValues.startDate).toISOString() : undefined,
      endDate: formValues.endDate ? new Date(formValues.endDate).toISOString() : undefined,
      location: formValues.venueLocation,
      description: formValues.description,
      isOnline: formValues.isOnline
    };

    this.formSubmitted.emit(formData);
  }

  onDoItLater(): void {
    this.doItLater.emit();
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

  get showNavigationButtons(): boolean {
    return this.mode === 'create';
  }

  get showSaveButton(): boolean {
    return this.mode === 'edit';
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
