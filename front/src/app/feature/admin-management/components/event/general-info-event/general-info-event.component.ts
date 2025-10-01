import { Component, computed, effect, inject, input, output, DestroyRef, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, debounceTime } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventDTO } from '../../../type/event/eventDTO';
import { Team } from '../../../type/team/team';
import { SaveStatus } from '../../../../../core/types/save-status.types';
import { TeamService } from '../../../services/team/team.service';
import { EventDataService } from '../../../services/event/event-data.service';
import { EventService } from '../../../services/event/event.service';
import { AutoSaveService } from '../../services/auto-save.service';
import { FieldComponent } from '../../../../../shared/input/field.component';
import { SaveIndicatorComponent } from '../../../../../core/save-indicator/save-indicator.component';
import { ButtonComponent } from '../../../../../shared/button/button.component';
import { environment } from '../../../../../../environments/environment.development';
import {CommonModule} from '@angular/common';
import {VisibilitySelectorComponent} from '../visibility-selector/visibility-selector.component';
import {TimezoneSelectorComponent} from '../timezone-selector/timezone-selector.component';
import {FormFieldConfig, FormFieldConfigService} from '../../../services/event/event-form-config.service';

@Component({
  selector: 'app-general-info-event',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, FieldComponent, SaveIndicatorComponent, ButtonComponent, VisibilitySelectorComponent, TimezoneSelectorComponent ],
  templateUrl: './general-info-event.component.html'
})

export class GeneralInfoEventComponent {
  mode = input<'create' | 'edit'>('create');
  initialData = input<Partial<EventDTO> | null>(null);
  initialVisibility = input<'private' | 'public'>('private');

  formSubmitted = output<EventDTO>();
  goBack = output<void>();

  private fb = inject(FormBuilder);
  private autoSaveService = inject(AutoSaveService);
  private eventService = inject(EventService);
  private snackBar = inject(MatSnackBar);
  private teamService = inject(TeamService);
  private eventDataService = inject(EventDataService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private formFieldConfigService = inject(FormFieldConfigService);

  form!: FormGroup;
  isSubmitted = false;
  teamId: string | null = null;
  eventUrl = '';
  teams: Team[] = [];
  saveStatus$ = new BehaviorSubject<SaveStatus>('idle');

  timezoneControl = new FormControl<string>('Europe/Paris', { nonNullable: true });

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
      this.initializeForm();
      this.setupSubscriptions();
      this.setupFormListeners();

      const currentInitialData = this.initialData();
      if (currentInitialData && this.mode() === 'edit') {
        this.loadInitialData(currentInitialData);
        this.setupAutoSave();
      }
    });
  }

  private initializeForm(): void {
    const nameValidators = [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50)
    ];

    const baseFormConfig = {
      urlConferenceHall: [''],
      timeZone: [this.timezoneControl.value, Validators.required],
      type: ['', Validators.required]
    };

    if (this.mode() === 'edit') {
      this.form = this.fb.group({
        eventName: ['', nameValidators],
        eventURL: [{ value: '', disabled: true }],
        visibility: [this.initialVisibility()],
        ...baseFormConfig
      });
    } else {
      this.form = this.fb.group({
        name: ['', nameValidators],
        url: [{ value: `${environment.baseUrl}/event/`, disabled: true }],
        teamId: [''],
        ...baseFormConfig
      });
    }
  }

  private setupSubscriptions(): void {
    this.teamService.teams$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((teams: Team[]) => this.teams = teams);

    if (this.mode() === 'create') {
      this.route.paramMap
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(params => {
          const param = params.get('eventUrl') || params.get('teamId');

          if (param) {
            const isTeamId = param.includes('team-') || /^[a-zA-Z0-9]{20,}$/.test(param);

            if (isTeamId) {
              this.teamId = param;
              this.form.get('teamId')?.setValue(param);
            } else {
              this.eventUrl = param;
            }
          }
        });
    }

    this.timezoneControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(timezone => {
        this.form.get('timeZone')?.setValue(timezone);
      });
  }

  private setupFormListeners(): void {
    const nameFieldKey = this.mode() === 'create' ? 'name' : 'eventName';
    const urlFieldKey = this.mode() === 'create' ? 'url' : 'eventURL';

    this.form.get(nameFieldKey)?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((name: string) => {
        const urlSuffix = this.formatUrlFromName(name || '');
        const fullUrl = `${environment.baseUrl}/event/${urlSuffix}`;

        this.form.get(urlFieldKey)?.setValue(fullUrl);

        if (this.mode() === 'create') {
          this.eventDataService.setEventName(name || '');
        }
      });
  }

  private setupAutoSave(): void {
    const currentInitialData = this.initialData();

    if (this.mode() !== 'edit' || !currentInitialData?.idEvent) {
      return;
    }

    const { saveStatus$ } = this.autoSaveService.setupAutoSave<EventDTO>(
      this.form,
      (data: Partial<EventDTO>) => this.eventService.updateEvent(data),
      {
        extractValidFields: () => this.extractValidEventData(),
        onSaveStart: () => this.form.markAsPristine(),
        onSaveSuccess: (result: EventDTO) => {
          console.log('Event auto-saved successfully:', result);
        },
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
        if (timezone !== currentInitialData?.timeZone) {
          this.form.markAsDirty();
        }
      });
  }

  private extractValidEventData(): Partial<EventDTO> {
    const formValue = this.form.getRawValue();
    const currentInitialData = this.initialData();

    const data: Partial<EventDTO> = {
      idEvent: currentInitialData?.idEvent
    };

    const fieldMappings: Array<{
      formKey: string;
      dtoKey: keyof EventDTO;
      initialValue: unknown;
    }> = [
      {
        formKey: 'eventName',
        dtoKey: 'eventName',
        initialValue: currentInitialData?.eventName
      },
      {
        formKey: 'urlConferenceHall',
        dtoKey: 'conferenceHallUrl',
        initialValue: currentInitialData?.conferenceHallUrl
      },
      {
        formKey: 'type',
        dtoKey: 'type',
        initialValue: currentInitialData?.type
      },
      {
        formKey: 'timeZone',
        dtoKey: 'timeZone',
        initialValue: currentInitialData?.timeZone
      }
    ];

    fieldMappings.forEach(({ formKey, dtoKey, initialValue }) => {
      if (formValue[formKey] !== undefined && formValue[formKey] !== initialValue) {
        (data as Record<string, unknown>)[dtoKey] = formValue[formKey];
      }
    });

    const currentIsPrivate = formValue.visibility === 'private';
    if (currentIsPrivate !== currentInitialData?.isPrivate) {
      data.isPrivate = currentIsPrivate;
    }

    return data;
  }

  private loadInitialData(data: Partial<EventDTO>): void {
    if (this.mode() !== 'edit') return;

    const fullUrl = data.url
      ? data.url.startsWith('http')
        ? data.url
        : `${environment.baseUrl}/event/${data.url}`
      : '';

    const visibility = data.isPrivate ? 'private' : 'public';

    this.form.patchValue({
      eventName: data.eventName || '',
      eventURL: fullUrl,
      urlConferenceHall: data.conferenceHallUrl || '',
      timeZone: data.timeZone || 'Europe/Paris',
      visibility,
      type: data.type
    });

    if (data.timeZone) {
      this.timezoneControl.setValue(data.timeZone);
    }
  }

  private formatUrlFromName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  onSubmit(): void {
    if (this.mode() === 'edit') return;

    this.isSubmitted = true;

    if (this.form.invalid) {
      console.warn('Form invalid:', this.form.errors);
      return;
    }

    const formValue = this.form.getRawValue();

    const newEvent: EventDTO = {
      eventName: formValue.name,
      url: formValue.url,
      conferenceHallUrl: formValue.urlConferenceHall,
      timeZone: formValue.timeZone,
      teamId: formValue.teamId || this.teamId,
      isPrivate: true,
      type: formValue.type
    };

    this.formSubmitted.emit(newEvent);
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

