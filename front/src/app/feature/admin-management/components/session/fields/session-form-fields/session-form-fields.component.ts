import {Component, computed, input, output} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {Category, Format, Speaker} from '../../../../type/session/session';
import {SessionSpeakersFieldComponent} from '../session-speakers-field/session-speakers-field.component';
import {SessionLanguagesFieldComponent} from '../session-languages-field/session-languages-field.component';
import {SessionDatetimeFieldsComponent} from '../session-datetime-fields/session-datetime-fields.component';
import {FieldComponent} from '../../../../../../shared/input/field.component';
import {
  SessionCategoriesFormatsFieldComponent
} from '../session-categories-formats-field/session-categories-formats-field.component';
import {SessionDurationFieldComponent} from '../session-duration-field/session-duration-field.component';

@Component({
  selector: 'app-session-form-fields',
  imports: [
    SessionSpeakersFieldComponent,
    SessionCategoriesFormatsFieldComponent,
    SessionLanguagesFieldComponent,
    SessionDurationFieldComponent,
    SessionDatetimeFieldsComponent,
    FieldComponent
  ],
  templateUrl: './session-form-fields.component.html',
  standalone: true,
  styleUrl: './session-form-fields.component.scss'
})
export class SessionFormFieldsComponent {
  form = input.required<FormGroup>();
  availableFormats = input<Format[]>([]);
  availableCategories = input<Category[]>([]);
  availableTracks = input<string[]>([]);
  eventStartDate = input<Date | undefined>();
  eventEndDate = input<Date | undefined>();
  selectedSpeakers = input<Speaker[]>([]);
  availableSpeakers = input<Speaker[]>([]);
  isLoadingSpeakers = input<boolean>(false);
  selectedDuration = input<number>(60);
  selectedFormats = input<string[]>([]);
  selectedCategories = input<string[]>([]);
  selectedLanguages = input<string[]>([]);

  durationChange = output<number>();
  speakersChange = output<Speaker[]>();
  formatsChange = output<string[]>();
  categoriesChange = output<string[]>();
  languagesChange = output<string[]>();

  readonly levelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  readonly trackOptions = computed(() =>
    this.availableTracks().map(track => ({
      value: track,
      label: track
    }))
  );

  onDurationChange(duration: number): void {
    this.durationChange.emit(duration);
  }

  onSpeakersChange(speakers: Speaker[]): void {
    this.speakersChange.emit(speakers);
  }

  onFormatsChange(formats: string[]): void {
    this.formatsChange.emit(formats);
  }

  onCategoriesChange(categories: string[]): void {
    this.categoriesChange.emit(categories);
  }
}
