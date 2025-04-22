import {Component, Input} from '@angular/core';
import {NavbarTeamPageComponent} from '../components/navbar-team-page/navbar-team-page.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TeamSidebarComponent} from '../components/team-sidebar/team-sidebar.component';
import {InputComponent} from '../../../shared/input/input.component';
import {FormField} from '../../../shared/input/interface/form-field';
import {ActivatedRoute, Router} from '@angular/router';
import {TeamService} from '../create-team/service/team.service';
import {finalize} from 'rxjs';

@Component({
  selector: 'app-setting-team-general-page',
  imports: [
    NavbarTeamPageComponent,
    FormsModule,
    TeamSidebarComponent,
    InputComponent,
    ReactiveFormsModule
  ],
  templateUrl: './setting-team-general-page.component.html',
  styleUrl: './setting-team-general-page.component.scss'
})
export class SettingTeamGeneralPageComponent {
  activeSection: string = 'settings-general';
  teamUrl: string = '';
  teamId: string = '';
  teamName: string = '';
  isLoading: boolean = true;
  error: string | null = null;
  baseUrl: string = 'https://speaker-space.io/team/';

  formValues: Record<string, any> = {
    teamName: '',
    teamURL: ''
  };

  formFields: FormField[] = [
    {
      name: 'teamName',
      label: 'Team name',
      type: 'text',
      required: true,
    },
    {
      name: 'teamURL',
      label: 'Team URL',
      type: 'text',
      required: true,
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService
  ) {}

  ngOnInit() {
    this.activeSection = 'setting-general';
    this.isLoading = true;

    this.route.paramMap.subscribe(params => {
      this.teamUrl = params.get('teamUrl') || '';

      if (this.teamUrl) {
        this.loadTeamData();
      } else {
        this.error = 'Team URL is missing';
        this.isLoading = false;
      }
    });
  }

  loadTeamData() {
    console.log('Loading team data for URL:', this.teamUrl);

    this.teamService.getTeamByUrl(this.teamUrl)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (team) => {
          console.log('Team data received:', team);
          this.teamId = team.id || '';
          this.teamName = team.name;

          this.formValues['teamName'] = team.name;
          this.formValues['teamURL'] = team.url || this.baseUrl;

          this.error = null;
        },
        error: (err) => {
          console.error('Error loading team data:', err);
          this.error = 'Failed to load team details. Please try again.';
        }
      });
  }

  onSubmit() {
    if (!this.teamId) {
      this.error = 'Team ID is missing';
      return;
    }

    const updatedTeam = {
      name: this.formValues['teamName'],
      url: this.formValues['teamURL']
    };

    this.isLoading = true;

    this.teamService.updateTeam(this.teamId, updatedTeam)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (team) => {
          this.teamName = team.name;
          this.teamUrl = team.url || '';
          },
        error: (err) => {
          console.error('Error updating team:', err);
          this.error = 'Failed to update team. Please try again.';
        }
      });
  }
}
