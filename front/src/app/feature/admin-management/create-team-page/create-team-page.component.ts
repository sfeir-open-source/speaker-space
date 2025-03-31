import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../../shared/input/input.component';
import { ButtonGreenActionsComponent } from '../../../shared/button-green-actions/button-green-actions.component';
import {FormField} from '../../../shared/input/interface/form-field';

@Component({
  selector: 'app-create-team-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    ButtonGreenActionsComponent,
  ],
  templateUrl: './create-team-page.component.html',
  styleUrl: './create-team-page.component.scss'
})
export class CreateTeamPageComponent {
  form: FormGroup;
  formFields: FormField[] = [
    {
      name: 'teamName',
      label: 'Team name',
      placeholder: 'Enter your team name',
      type: 'text',
      required: true,
    },
    {
      name: 'teamUrl',
      label: 'Team URL',
      placeholder: 'https://speaker-space.io/team/',
      type: 'text',
      required: true,
    }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      teamName: ['', [Validators.minLength(2), Validators.maxLength(50)]],
      teamUrl: ['']
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  getFormControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  protected readonly FormControl = FormControl;
}
