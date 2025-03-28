import {Component, Input} from '@angular/core';
import {NavbarTeamPageComponent} from '../components/navbar-team-page/navbar-team-page.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TeamSidebarComponent} from '../components/team-sidebar/team-sidebar.component';
import {InputComponent} from '../../../shared/input/input.component';
import {FormField} from '../../../shared/input/interface/form-field';

@Component({
  selector: 'app-setting-team-page',
  imports: [
    NavbarTeamPageComponent,
    FormsModule,
    TeamSidebarComponent,
    InputComponent,
    ReactiveFormsModule
  ],
  templateUrl: './setting-team-page.component.html',
  styleUrl: './setting-team-page.component.scss'
})
export class SettingTeamPageComponent {
  activeSection: string = 'general';

  formValues: Record<string, any> = {
    teamName: '',
    teamURL: ''
  };

  formFields: FormField[] = [
    {
      name: 'teamName',
      label: 'Team name',
      type: 'text',
    },
    {
      name: 'teamURL',
      label: 'Team URL',
      type: 'text',
    }
  ];

  onSubmit() {
  }
}
