import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {Category, Format, Speaker} from '../../../../type/session/session';
import {InputComponent} from '../../../../../../shared/input/input.component';
import {SessionSpeakersFieldComponent} from '../session-speakers-field/session-speakers-field.component';
import {
  SessionCategoriesFormatsFieldComponent
} from '../session-categories-formats-field/session-categories-formats-field.component';
import {SessionLanguagesFieldComponent} from '../session-languages-field/session-languages-field.component';
import {SessionDurationFieldComponent} from '../session-duration-field/session-duration-field.component';
import {SessionDatetimeFieldsComponent} from '../session-datetime-fields/session-datetime-fields.component';

@Component({
  selector: 'app-session-form-fields',
  imports: [
    InputComponent,
    SessionSpeakersFieldComponent,
    SessionCategoriesFormatsFieldComponent,
    SessionLanguagesFieldComponent,
    SessionDurationFieldComponent,
    SessionDatetimeFieldsComponent
  ],
  templateUrl: './session-form-fields.component.html',
  styleUrl: './session-form-fields.component.scss'
})
export class SessionFormFieldsComponent {
  @Input() form!: FormGroup;
  @Input() availableFormats: Format[] = [];
  @Input() availableCategories: Category[] = [];
  @Input() availableTracks: string[] = [];
  @Input() eventStartDate?: Date;
  @Input() eventEndDate?: Date;
  @Input() selectedSpeakers: Speaker[] = [];
  @Input() availableSpeakers: Speaker[] = [];
  @Input() isLoadingSpeakers: boolean = false;
  @Input() selectedDuration: number = 60;
  @Input() selectedFormats: string[] = [];
  @Input() selectedCategories: string[] = [];
  @Input() selectedLanguages: string[] = [];

  @Output() durationChange = new EventEmitter<number>();
  @Output() speakersChange = new EventEmitter<Speaker[]>();
  @Output() formatsChange = new EventEmitter<string[]>();
  @Output() categoriesChange = new EventEmitter<string[]>();
  @Output() languagesChange = new EventEmitter<string[]>();

  readonly levelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  get trackOptions(): { value: string; label: string }[] {
    return this.availableTracks.map(track => ({ value: track, label: track }));
  }

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
