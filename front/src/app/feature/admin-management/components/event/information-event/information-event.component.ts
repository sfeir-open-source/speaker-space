import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {BehaviorSubject, Subject, Subscription} from 'rxjs';
import {ButtonGreenActionsComponent} from '../../../../../shared/button-green-actions/button-green-actions.component';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {InputComponent} from '../../../../../shared/input/input.component';
import {EventDTO} from '../../../type/event/eventDTO';
import {EventDataService} from '../../../services/event/event-data.service';
import {TeamService} from '../../../services/team/team.service';
import {FormField} from '../../../../../shared/input/interface/form-field';
import {SaveStatus} from '../../../../../core/types/save-status.types';
import {AutoSaveService} from '../../services/auto-save.service';
import {EventService} from '../../../services/event/event.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SaveIndicatorComponent} from '../../../../../core/save-indicator/save-indicator.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-information-event',
  standalone: true,
  imports: [
    ButtonGreenActionsComponent,
    ButtonGreyComponent,
    ReactiveFormsModule,
    FormsModule,
    InputComponent,
    SaveIndicatorComponent,
    AsyncPipe
  ],
  templateUrl: './information-event.component.html',
  styleUrl: './information-event.component.scss'
})
export class InformationEventComponent implements OnInit, OnDestroy {
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

  saveStatus$ = new BehaviorSubject<SaveStatus>('idle');

  private autoSaveDestroy$ = new Subject<void>();
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private autoSaveService: AutoSaveService,
    private eventService: EventService,
    private eventDataService: EventDataService,
    private snackBar: MatSnackBar,
    private teamService: TeamService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupSubscriptions();

    if (this.initialData && this.mode === 'edit') {
      this.loadInitialData(this.initialData);
      this.setupAutoSave();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.autoSaveDestroy$.next();
    this.autoSaveDestroy$.complete();
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

  private setupAutoSave(): void {
    if (this.mode !== 'edit' || !this.initialData?.idEvent) {
      return;
    }

    const { saveStatus$, destroy$ } = this.autoSaveService.setupAutoSave<EventDTO>(
      this.form,
      (data: EventDTO) => this.eventService.updateEvent(data),
      {
        extractValidFields: () => this.extractValidEventData(),
        onSaveStart: () => {
          this.form.markAsPristine();
        },
        onSaveSuccess: (result: EventDTO) => {
          console.log('Event information auto-saved successfully:', result);
        },
        onSaveError: (error: any) => {
          console.error('Auto-save failed:', error);
          this.snackBar.open('Erreur lors de la sauvegarde automatique', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.form.markAsDirty();
        }
      }
    );

    this.saveStatus$ = saveStatus$ as BehaviorSubject<SaveStatus>;
    this.autoSaveDestroy$ = destroy$;
  }

  private extractValidEventData(): EventDTO {
    const formValue = this.form.value;

    return {
      idEvent: this.initialData?.idEvent,
      startDate: formValue.startDate ? new Date(formValue.startDate).toISOString() : undefined,
      endDate: formValue.endDate ? new Date(formValue.endDate).toISOString() : undefined,
      location: formValue.venueLocation,
      description: formValue.description,
      isOnline: formValue.isOnline
    } as EventDTO;
  }

  async onSubmit(): Promise<void> {
    if (this.mode === 'edit') {
      return;
    }

    this.isSubmitted = true;

    if (this.form.invalid || !this.validateDates()) {
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

  get showNavigationButtons(): boolean {
    return this.mode === 'create';
  }

  get showAutoSaveIndicator(): boolean {
    return this.mode === 'edit';
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
