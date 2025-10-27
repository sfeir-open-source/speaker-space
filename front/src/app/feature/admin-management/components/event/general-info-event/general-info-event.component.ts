import {Component, computed, effect, inject, input, output, DestroyRef, Signal, signal} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, debounceTime } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

import { EventDTO } from '../../../type/event/eventDTO';
import { Team } from '../../../type/team/team';
import { SaveStatus } from '../../../../../core/types/save-status.types';

import { TeamService } from '../../../services/team/team.service';
import { EventService } from '../../../services/event/event.service';
import { FormFieldConfig, FormFieldConfigService } from '../../../services/event/event-form-config.service';
import { EventFormService } from '../../../services/event/event-form.service';
import { EventDataMapperService } from '../../../services/event/event-data-mapper.service';

import { FieldComponent } from '../../../../../shared/input/field.component';
import { SaveIndicatorComponent } from '../../../../../core/save-indicator/save-indicator.component';
import { ButtonComponent } from '../../../../../shared/button/button.component';
import { VisibilitySelectorComponent } from '../visibility-selector/visibility-selector.component';
import { TimezoneSelectorComponent } from '../timezone-selector/timezone-selector.component';
import {AutoSaveService} from '../../../services/event/auto-save.service';

@Component({
  selector: 'app-general-info-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FieldComponent,
    SaveIndicatorComponent,
    ButtonComponent,
    VisibilitySelectorComponent,
    TimezoneSelectorComponent
  ],
  providers: [EventFormService],
  templateUrl: './general-info-event.component.html'
})
export class GeneralInfoEventComponent {
  mode = input<'create' | 'edit'>('create');
  initialData = input<Partial<EventDTO> | null>(null);
  initialVisibility = input<'private' | 'public'>('private');
  formSubmitted = output<EventDTO>();
  goBack = output<void>();

  private eventFormService = inject(EventFormService);
  private autoSaveService = inject(AutoSaveService);
  private eventService = inject(EventService);
  private snackBar = inject(MatSnackBar);
  private teamService = inject(TeamService);
  private formFieldConfigService = inject(FormFieldConfigService);
  private eventDataMapper = inject(EventDataMapperService);
  private destroyRef = inject(DestroyRef);

  form!: FormGroup;
  teams: Team[] = [];
  saveStatus$ = new BehaviorSubject<SaveStatus>('idle');
  timezoneControl = new FormControl<string>('Europe/Paris', { nonNullable: true });

  readonly isSubmitted = signal<boolean>(false);
  protected readonly showAutoSaveIndicator = computed(() => this.mode() === 'edit');
  protected readonly showGoBackButton = computed(() => this.mode() === 'create');
  protected readonly showVisibilitySection = computed(() => this.mode() === 'edit');
  protected readonly submitButtonText = computed(() =>
    this.mode() === 'create' ? 'Continue' : 'Update event'
  );
  protected readonly submitButtonIcon = computed(() =>
    this.mode() === 'create' ? 'arrow_forward' : 'save'
  );
  protected readonly formFields: Signal<FormFieldConfig[]> =
    this.formFieldConfigService.getFormFields(this.mode);

  constructor() {
    effect(() => {
      this.initializeComponent();
    });
  }

  private initializeComponent(): void {
    this.form = this.eventFormService.createForm({
      mode: this.mode(),
      initialVisibility: this.initialVisibility(),
      timezoneValue: this.timezoneControl.value
    });

    this.setupTeamsSubscription();
    this.setupTimezoneSync();
    this.eventFormService.setupUrlGeneration(this.form, this.mode);

    if (this.mode() === 'create') {
      this.eventFormService.handleRouteParams(this.form);
    }

    const currentInitialData = this.initialData();
    if (currentInitialData && this.mode() === 'edit') {
      this.loadInitialData(currentInitialData);
      this.setupAutoSave(currentInitialData);
    }
  }

  private setupTeamsSubscription(): void {
    this.teamService.teams$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((teams: Team[]) => this.teams = teams);
  }

  private setupTimezoneSync(): void {
    this.timezoneControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(timezone => {
        this.form.get('timeZone')?.setValue(timezone);
      });
  }

  private setupAutoSave(initialData: Partial<EventDTO>): void {
    if (!initialData.idEvent) return;

    const { saveStatus$ } = this.autoSaveService.setupAutoSave<EventDTO>(
      this.form,
      (data: Partial<EventDTO>) => this.eventService.updateEvent(data),
      {
        extractValidFields: () => this.eventDataMapper.extractModifiedFields(
          this.form.getRawValue(),
          this.initialData()
        ),
        onSaveStart: () => this.form.markAsPristine(),
        onSaveError: (error: unknown) => {
          console.error('Auto-save failed:', error);
          this.snackBar.open(
            'Erreur lors de la sauvegarde automatique',
            'Fermer',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
          this.form.markAsDirty();
        },
        debounceTime: 2000
      }
    );

    this.saveStatus$ = saveStatus$ as BehaviorSubject<SaveStatus>;

    this.timezoneControl.valueChanges
      .pipe(
        debounceTime(500),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(timezone => {
        if (timezone !== initialData.timeZone) {
          this.form.markAsDirty();
        }
      });
  }

  private loadInitialData(data: Partial<EventDTO>): void {
    const formData = this.eventDataMapper.prepareInitialFormData(data);
    this.form.patchValue(formData);

    if (data.timeZone) {
      this.timezoneControl.setValue(data.timeZone);
    }
  }

  onSubmit(): void {
    if (this.mode() === 'edit') return;

    this.isSubmitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.logFormErrors();
      return;
    }

    const newEvent = this.eventDataMapper.formToEventDTO(
      this.form.getRawValue(),
      this.eventFormService.teamId
    );

    this.formSubmitted.emit(newEvent);
  }

  private logFormErrors(): void {
    const errors: Record<string, unknown> = {};

    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.errors) {
        errors[key] = control.errors;
      }
    });
  }

  onGoBack(): void {
    this.goBack.emit();
  }

  getFormControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  get visibilityControl(): FormControl<'private' | 'public'> {
    return this.form.get('visibility') as FormControl<'private' | 'public'>;
  }
}
