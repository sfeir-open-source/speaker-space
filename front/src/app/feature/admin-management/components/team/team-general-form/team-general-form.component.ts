import {Component, effect, inject, input, OnInit, output} from '@angular/core';
import {FormControl, FormsModule} from '@angular/forms';
import {FormField} from '../../../../../shared/input/interface/form-field';
import {TeamFormData, TeamFormService} from '../../../services/team/team-form.service';
import {TeamManagementService} from '../../../services/team/team-management.service';
import {ButtonComponent} from '../../../../../shared/button/button.component';
import {FieldComponent} from '../../../../../shared/input/field.component';

@Component({
  selector: 'app-team-general-form',
  imports: [
    ButtonComponent,
    FieldComponent,
    FormsModule
  ],
  templateUrl: './team-general-form.component.html',
  styleUrl: './team-general-form.component.scss'
})
export class TeamGeneralFormComponent implements OnInit {
  readonly teamData = input.required<TeamFormData>();
  readonly currentUserRole = input.required<string>();
  readonly isLoading = input<boolean>(false);

  readonly formSubmitted = output<TeamFormData>();
  readonly formError = output<string>();

  readonly formService = inject(TeamFormService);
  private readonly teamManagementService = inject(TeamManagementService);

  readonly formFields: FormField[] = [
    {
      name: 'teamName',
      label: 'Team name',
      placeholder: '',
      type: 'text',
      required: true,
    },
    {
      name: 'teamURL',
      label: 'Team URL',
      placeholder: '',
      type: 'text',
      required: false,
      disabled: true,
    }
  ];

  constructor() {
    effect(() => {
      this.formService.updateFormPermissions(this.currentUserRole());
    });

    effect(() => {
      this.formService.updateFormData(this.teamData());
    });
  }

  ngOnInit(): void {
    this.setupNameChangeListener();
  }

  private setupNameChangeListener(): void {
    this.formService.setupNameChangeListener((url) => {
      const urlControl = this.formService.getFormControl('teamURL');
      if (urlControl) {
        const formattedUrl = this.teamManagementService.formatUrlFromName(url);
        urlControl.setValue(formattedUrl);
      }
    }).subscribe();
  }

  onSubmit(): void {
    if (!this.formService.isValid()) {
      this.formError.emit('Form is invalid');
      return;
    }

    const formData = this.formService.getFormValue();
    this.formSubmitted.emit(formData);
  }

  getFormControl(name: string): FormControl {
    return this.formService.getFormControl(name);
  }
}
