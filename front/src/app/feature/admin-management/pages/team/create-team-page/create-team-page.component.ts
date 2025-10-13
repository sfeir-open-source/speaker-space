import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FieldComponent } from '../../../../../shared/input/field.component';
import { TeamService } from '../../../services/team/team.service';
import { FormField } from '../../../../../shared/input/interface/form-field';
import { Team } from '../../../type/team/team';
import {ButtonComponent} from '../../../../../shared/button/button.component';

@Component({
  selector: 'app-create-team-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FieldComponent,
    ButtonComponent,
  ],
  templateUrl: './create-team-page.component.html',
  styleUrl: './create-team-page.component.scss'
})
export class CreateTeamPageComponent implements OnInit {
  private readonly _router = inject(Router);
  private readonly _teamService = inject(TeamService);
  private readonly _fb = inject(FormBuilder);
  private readonly _baseUrl = 'https://speaker-space.io/team/' as const;

  readonly form: FormGroup;

  isSubmitted = false;

  readonly formFields: readonly FormField[] = [
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
      disabled: true,
    }
  ] as const;

  constructor() {
    this.form = this._fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      url: [{ value: this._baseUrl, disabled: true }]
    });
  }

  ngOnInit(): void {
    this.form.get('name')?.valueChanges.subscribe(value => {
      const urlSuffix = this.generateUrlSuffix(value);
      this.form.get('url')?.setValue(this._baseUrl + urlSuffix);
    });
  }

  private generateUrlSuffix(value: string): string {
    if (!value) return '';

    return value.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  onSubmit(): void {
    this.isSubmitted = true;

    if (this.form.invalid) {
      return;
    }

    const team: Team = {
      name: this.form.value.name || '',
      url: this.form.get('url')?.value || ''
    };

    this._teamService.createTeam(team).subscribe({
      next: (response) => {
        const navigationTarget = response.id ?? '';
        this._router.navigate(['/team', navigationTarget]);
      }
    });
  }

  getFormControl(name: string): FormControl {
    const control = this.form.get(name);
    if (!control) {
      throw new Error(`FormControl '${name}' not found`);
    }
    return control as FormControl;
  }
}
