import { Component, input, OnDestroy, OnInit, output, signal, inject, effect } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FieldComponent } from '../../../../../shared/input/field.component';
import { SaveIndicatorComponent } from '../../../../../core/save-indicator/save-indicator.component';
import { ButtonComponent } from '../../../../../shared/button/button.component';
import { EventDTO } from '../../../type/event/eventDTO';
import { SaveStatus } from '../../../../../core/types/save-status.types';
import { EventDataService } from '../../../services/event/event-data.service';
import { TeamService } from '../../../services/team/team.service';
import { EventService } from '../../../services/event/event.service';
import { AutoSaveService } from '../../../services/event/auto-save.service';
import {EventFormService} from '../../../services/event/event-form.service';
import {EVENT_ADDITIONAL_FIELDS, EVENT_FORM_FIELDS} from '../../../services/event/event-form-fields.service';

@Component({
  selector: 'app-information-event',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    FieldComponent,
    SaveIndicatorComponent,
    ButtonComponent
  ],
  providers: [EventFormService],
  templateUrl: './information-event.component.html',
  styleUrl: './information-event.component.scss'
})
export class InformationEventComponent implements OnInit, OnDestroy {
  private readonly eventFormService = inject(EventFormService);
  private readonly autoSaveService = inject(AutoSaveService);
  private readonly eventService = inject(EventService);
  private readonly eventDataService = inject(EventDataService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly teamService = inject(TeamService);

  readonly mode = input<'create' | 'edit'>('create');
  readonly initialData = input<Partial<EventDTO> | null>(null);
  readonly formSubmitted = output<Partial<EventDTO>>();
  readonly doItLater = output<void>();

  readonly isSubmitted = signal<boolean>(false);
  readonly eventId = signal<string>('');
  readonly teamId = signal<string | null>(null);
  readonly teamUrl = signal<string | null>(null);
  readonly eventName = signal<string>('');
  readonly currentEvent = signal<EventDTO>({} as EventDTO);
  readonly saveStatus = signal<SaveStatus>('idle');

  readonly formFields = EVENT_FORM_FIELDS;
  readonly additionalFields = EVENT_ADDITIONAL_FIELDS;

  readonly showNavigationButtons = (): boolean => this.mode() === 'create';
  readonly showAutoSaveIndicator = (): boolean => this.mode() === 'edit';

  form!: FormGroup;
  private autoSaveDestroy$ = new Subject<void>();
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.form = this.eventFormService.createEventForm();
    this.setupSubscriptions();

    if (this.initialData() && this.mode() === 'edit') {
      this.eventFormService.loadFormData(this.form, this.initialData()!);
      this.setupAutoSave();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.autoSaveDestroy$.next();
    this.autoSaveDestroy$.complete();
  }

  private setupSubscriptions(): void {
    this.subscriptions.add(
      this.eventDataService.eventId$.subscribe(id => this.eventId.set(id))
    );

    this.subscriptions.add(
      this.eventDataService.eventName$.subscribe(name => this.eventName.set(name))
    );

    this.subscriptions.add(
      this.eventDataService.event$.subscribe(event => {
        this.currentEvent.set(event);
        this.loadEventData(event);
      })
    );
  }

  private loadEventData(event: EventDTO): void {
    if (event.teamId) {
      this.teamId.set(event.teamId);
      this.teamService.getTeamById(event.teamId).subscribe(team => {
        if (team?.id) {
          this.teamId.set(team.id.split('/').pop() || null);
        }
      });
    }
    this.eventFormService.loadFormData(this.form, event);
  }

  private setupAutoSave(): void {
    if (this.mode() !== 'edit' || !this.initialData()?.idEvent) {
      return;
    }

    const { destroy$ } = this.autoSaveService.setupAutoSave<EventDTO>(
      this.form,
      (data: Partial<EventDTO>) => this.eventService.updateEvent(data),
      {
        extractValidFields: () => this.eventFormService.extractValidEventData(this.form, this.initialData()),
        onSaveStart: () => {
          this.form.markAsPristine();
          this.saveStatus.set('saving');
        },
        onSaveSuccess: (result: EventDTO) => {
          console.log('Event information auto-saved successfully:', result);
          this.saveStatus.set('saved');
        },
        onSaveError: (error: unknown) => {
          console.error('Auto-save failed:', error);
          this.saveStatus.set('error');
          this.snackBar.open('Erreur lors de la sauvegarde automatique', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.form.markAsDirty();
        }
      }
    );

    this.autoSaveDestroy$ = destroy$;
  }

  async onSubmit(): Promise<void> {
    if (this.mode() === 'edit') {
      return;
    }

    this.isSubmitted.set(true);

    if (this.form.invalid || !this.eventFormService.validateDates(this.form)) {
      return;
    }

    const formData = this.eventFormService.prepareSubmitData(this.form);
    this.formSubmitted.emit(formData);
  }

  onGoBack(): void {
    this.doItLater.emit();
  }

  getFormControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }
}
