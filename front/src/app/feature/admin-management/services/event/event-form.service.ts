import { Injectable, Signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {EventDataService} from './event-data.service';
import {FormConfig} from '../../type/event/form-config';
import {environment} from '../../../../../environments/environment.development';

@Injectable()
export class EventFormService {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private eventDataService = inject(EventDataService);
  private destroyRef = inject(DestroyRef);

  teamId: string | null = null;
  eventUrl = '';

  private readonly NAME_VALIDATORS = [
    Validators.required,
    Validators.minLength(2),
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
}
