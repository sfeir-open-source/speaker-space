import { Signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EventDataService } from './event-data.service';
import { FormConfig } from '../../type/event/form-config';
import { environment } from '../../../../../environments/environment.development';
import { EventDTO } from '../../type/event/eventDTO';
import {EventValidators} from './event-validators.service';

export class EventFormService {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private eventDataService = inject(EventDataService);
  private destroyRef = inject(DestroyRef);

  teamId: string | null = null;
  eventUrl = '';

  private readonly NAME_VALIDATORS = [
    Validators.required,
    EventValidators.eventNameMinLength(2),
    Validators.maxLength(50)
  ];

  createForm(config: FormConfig): FormGroup {
    const baseFormConfig = {
      urlConferenceHall: [''],
      timeZone: [config.timezoneValue, Validators.required],
      type: ['', Validators.required]
    };

    if (config.mode === 'edit') {
      return this.fb.group({
        eventName: ['', this.NAME_VALIDATORS],
        eventURL: [{ value: '', disabled: true }],
        visibility: [config.initialVisibility],
        ...baseFormConfig
      });
    }

    return this.fb.group({
      name: ['', this.NAME_VALIDATORS],
      url: [{ value: `${environment.baseUrl}/event/`, disabled: true }],
      teamId: [''],
      ...baseFormConfig
    });
  }

  setupUrlGeneration(form: FormGroup, mode: Signal<'create' | 'edit'>): void {
    const nameFieldKey = mode() === 'create' ? 'name' : 'eventName';
    const urlFieldKey = mode() === 'create' ? 'url' : 'eventURL';

    form.get(nameFieldKey)?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((name: string) => {
        const urlSuffix = this.formatUrlFromName(name || '');
        const fullUrl = `${environment.baseUrl}/event/${urlSuffix}`;

        form.get(urlFieldKey)?.setValue(fullUrl);

        if (mode() === 'create') {
          this.eventDataService.setEventName(name || '');
        }
      });
  }

  handleRouteParams(form: FormGroup): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const param = params.get('eventUrl') || params.get('teamId');

        if (param) {
          const isTeamId = param.includes('team-') || /^[a-zA-Z0-9]{20,}$/.test(param);

          if (isTeamId) {
            this.teamId = param;
            form.get('teamId')?.setValue(param);
          } else {
            this.eventUrl = param;
          }
        }
      });
  }

  private formatUrlFromName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  createEventForm(): FormGroup {
    const form = this.fb.group({
      startDate: ['', [
        Validators.required,
        EventValidators.startDateAfterToday()
      ]],
      endDate: ['', [
        Validators.required,
        EventValidators.endDateAfterStart('startDate')
      ]],

      online: [false],
      venueLocation: ['', [Validators.required]],
      description: [''],
      webLinkUrl: ['', [
        EventValidators.validUrl()
      ]]
    });

    form.get('startDate')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const endDateControl = form.get('endDate');
        if (endDateControl?.value) {
          endDateControl.updateValueAndValidity({ emitEvent: false });
        }
      });

    form.get('online')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(online => {
        const venueLocationControl = form.get('venueLocation');
        if (!online) {
          venueLocationControl?.setValidators([Validators.required]);
        } else {
          venueLocationControl?.clearValidators();
        }
        venueLocationControl?.updateValueAndValidity();
      });

    return form;
  }

  loadFormData(form: FormGroup, data: Partial<EventDTO>): void {
    if (data.startDate) {
      form.get('startDate')?.setValue(this.formatDateForInput(data.startDate));
    }
    if (data.endDate) {
      form.get('endDate')?.setValue(this.formatDateForInput(data.endDate));
    }
    form.get('online')?.setValue(data.online === true);
    if (data.webLinkUrl) {
      form.get('webLinkUrl')?.setValue(data.webLinkUrl);
    }
    if (data.location) {
      form.get('venueLocation')?.setValue(data.location);
    }
    if (data.description) {
      form.get('description')?.setValue(data.description);
    }
  }

  extractValidEventData(form: FormGroup, initialData: Partial<EventDTO> | null): Partial<EventDTO> {
    const formValue = form.value;
    const data: Partial<EventDTO> = {
      idEvent: initialData?.idEvent
    };

    if (formValue.startDate !== undefined && formValue.startDate !== this.formatDateForInput(initialData?.startDate)) {
      data.startDate = formValue.startDate ? new Date(formValue.startDate).toISOString() : undefined;
    }

    if (formValue.endDate !== undefined && formValue.endDate !== this.formatDateForInput(initialData?.endDate)) {
      data.endDate = formValue.endDate ? new Date(formValue.endDate).toISOString() : undefined;
    }

    if (formValue.venueLocation !== initialData?.location) {
      data.location = formValue.venueLocation;
    }

    if (formValue.description !== initialData?.description) {
      data.description = formValue.description;
    }

    if (formValue.online !== initialData?.online) {
      data.online = formValue.online;
    }

    if (formValue.webLinkUrl !== initialData?.webLinkUrl) {
      data.webLinkUrl = formValue.webLinkUrl;
    }

    return data;
  }

  prepareSubmitData(form: FormGroup): Partial<EventDTO> {
    const formValues = form.getRawValue();

    const data: Partial<EventDTO> = {
      startDate: this.formatDateForBackend(formValues.startDate),
      endDate: this.formatDateForBackend(formValues.endDate),
      location: formValues.venueLocation?.trim() || null,
      description: formValues.description?.trim() || null,
      online: formValues.online ?? false,
      webLinkUrl: formValues.webLinkUrl?.trim() || null
    };

    return data;
  }

  private formatDateForInput(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private formatDateForBackend(dateValue: string | null | undefined): string | undefined {
    if (!dateValue || dateValue.trim() === '') {
      return undefined;
    }

    try {
      if (dateValue.includes('T')) {
        return dateValue;
      }

      const isoString = `${dateValue}T00:00:00.000Z`;
      const testDate = new Date(isoString);
      if (isNaN(testDate.getTime())) {
        return undefined;
      }

      return isoString;

    } catch (error) {
      console.error('Error formatting date:', dateValue, error);
      return undefined;
    }
  }
}
