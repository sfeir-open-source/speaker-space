import { FormField } from '../../../../shared/input/interface/form-field';

export const EVENT_FORM_FIELDS: FormField[] = [
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

export const EVENT_ADDITIONAL_FIELDS: FormField[] = [
  { name: 'webLinkUrl', label: 'Event web link', type: 'text' },
  { name: 'venueLocation', label: 'Venue location (address, city, country)', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' }
];
