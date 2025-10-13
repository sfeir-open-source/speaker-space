import {Component, input} from '@angular/core';
import {FormControl} from '@angular/forms';

@Component({
  selector: 'app-form-field-errors',
  imports: [],
  templateUrl: './form-field-errors.component.html',
  standalone: true,
  styleUrl: './form-field-errors.component.scss'
})

export class FormFieldErrorsComponent {
  control = input.required<FormControl>();
  fieldName = input.required<string>();
  isSubmitted = input.required<boolean>();

  protected isNameField = (): boolean => {
    const name = this.fieldName();
    return name === 'name' || name === 'eventName';
  };
}
