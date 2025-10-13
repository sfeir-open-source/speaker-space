import { Injectable, Signal, computed } from '@angular/core';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'select';
  required: boolean;
  placeholder?: string;
  paragraph?: string;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
}

@Injectable({ providedIn: 'root' })
export class FormFieldConfigService {
  private readonly EVENT_TYPE_OPTIONS = [
    { value: 'conference', label: 'Conference' },
    { value: 'meetup', label: 'Meetup' }
  ] as const;

  private readonly COMMON_FIELDS: Omit<FormFieldConfig, 'name'>[] = [
    {
      label: 'Conference Hall URL Connection',
      paragraph: 'Use a conference hall existing URL if you want to synchronize conference Hall data',
      type: 'text',
      required: false,
      placeholder: 'https://conference-hall.io/...'
    },
    {
      label: 'Event type',
      type: 'select',
      required: true,
      options: [...this.EVENT_TYPE_OPTIONS]
    }
  ];

  getFormFields(mode: Signal<'create' | 'edit'>): Signal<FormFieldConfig[]> {
    return computed(() => {
      const isCreateMode = mode() === 'create';

      const specificFields: FormFieldConfig[] = [
        {
          name: isCreateMode ? 'name' : 'eventName',
          label: 'Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your event name'
        },
        {
          name: isCreateMode ? 'url' : 'eventURL',
          label: 'Event URL',
          placeholder: 'https://speaker-space.io/event/',
          type: 'text',
          required: isCreateMode,
          disabled: true
        }
      ];

      return [
        ...specificFields,
        {
          name: 'urlConferenceHall',
          ...this.COMMON_FIELDS[0]
        },
        {
          name: 'type',
          ...this.COMMON_FIELDS[1]
        }
      ];
    });
  }
}
