import {Component, inject} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import {CommonModule} from '@angular/common';
import {InputComponent} from '../../../../shared/input/input.component';
import {ButtonGreenActionsComponent} from '../../../../shared/button-green-actions/button-green-actions.component';
import {FormField} from '../../../../shared/input/interface/form-field';
import {Router} from '@angular/router';
import {TeamService} from '../service/team.service';
import {Team} from '../type/team';


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
  private _router = inject(Router);
  private _teamService = inject(TeamService);

  isSubmitted = false;

  formFields: FormField[] = [
    {
      name: 'name',
      label: 'Team name',
      placeholder: 'Enter your team name',
      type: 'text',
      required: true,
    },
    {
      name: 'url',
      label: 'Team URL',
      placeholder: 'https://speaker-space.io/team/',
      type: 'text',
      required: false,
    }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      url: ['']
    });
  }

  onSubmit(): void {
    this.isSubmitted = true;

    if (this.form.invalid) {
      return;
    }

    const team: Team = {
      name: this.form.value.name || '',
      url: this.form.value.url || ''
    };

    this._teamService.post$(team).subscribe({
      next: response => {
        console.log('team created', response);
        this._router.navigate(['/team-page']);
      },
      error: error => {
        console.error('Error creating team', error);
      }
    });
  }


  getFormControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }
}
