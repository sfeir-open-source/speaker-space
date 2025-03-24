import {Component, Input} from '@angular/core';
import {FormComponent} from '../../../shared/form/form.component';
import {FormField} from '../../../shared/form/interface/form-field';

@Component({
  selector: 'app-create-team-page',
  imports: [
    FormComponent
  ],
  templateUrl: './create-team-page.component.html',
  styleUrl: './create-team-page.component.scss'
})
export class CreateTeamPageComponent {
  @Input() button: boolean = true;

  formFields: FormField[] = [
    {
      name: 'teamName',
      label: 'Team name',
      placeholder: 'Enter your team name',
      type: 'text',
      required: true
    },
    {
      name: 'teamUrl',
      label: 'Team URL',
      placeholder: 'https://speaker-space.io/team/',
      type: 'text',
      required: true
    }
  ];

  constructor() {
    console.log('Form fields:', this.formFields);
  }
}
