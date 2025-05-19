import { Component, OnInit, OnDestroy } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, Validators} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import {InputComponent} from '../../../../shared/input/input.component';
import {NavbarTeamPageComponent} from '../../components/navbar-team-page/navbar-team-page.component';
import {TeamSidebarComponent} from '../../components/team-sidebar/team-sidebar.component';
import {FormField} from '../../../../shared/input/interface/form-field';
import {AuthService} from '../../../../core/login/services/auth.service';
import {DeleteTeamPopupComponent} from '../../components/delete-team-popup/delete-team-popup.component';
import {TeamService} from '../../services/team/team.service';
import {TeamMemberService} from '../../services/team/team-member.service';
import {TeamMember} from '../../type/team/team-member';

@Component({
  selector: 'app-setting-team-general-page',
  standalone: true,
  imports: [
    InputComponent,
    NavbarTeamPageComponent,
    TeamSidebarComponent,
    FormsModule,
    DeleteTeamPopupComponent ],
  templateUrl: './setting-team-general-page.component.html',
  styleUrl: './setting-team-general-page.component.scss'
})
export class SettingTeamGeneralPageComponent implements OnInit, OnDestroy {
  readonly BASE_URL = 'https://speaker-space.io/team/';

  activeSection: string = 'settings-general';
  teamUrl : string = '';
  teamId : string = '';
  teamName: string  = '';
  isLoading : boolean = true;
  error: string | null = null;
  isDeleting : boolean = false;
  showDeleteConfirmation : boolean = false;
  currentUserRole: string = '';

  teamForm: FormGroup;
  private nameChangeSubscription?: Subscription;
  private routeSubscription?: Subscription;

  formFields: FormField[] = [
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    private teamMemberService: TeamMemberService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.teamForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.activeSection = 'settings-general';
    this.isLoading = true;
    this.checkForEmailModal();
    this.subscribeToRouteParams();

    this.authService.user$.subscribe(user => {
      if (user && this.teamId) {
        this.loadUserRole(user.uid);
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      teamName: [{value: '', disabled: false}, Validators.required],
      teamURL: {value: '', disabled: true}
    });
  }

  private checkForEmailModal(): void {
    const params = new URLSearchParams(window.location.search);
    const showEmailModal = params.get('showEmailModal');

    if (showEmailModal === 'true') {
      const modal = document.getElementById('crud-modal');
      if (modal) {
        modal.classList.remove('hidden');
      }
    }
  }

  private subscribeToRouteParams(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.teamUrl = params.get('teamUrl') || '';

      if (this.teamUrl) {
        this.loadTeamData();
      } else {
        this.error = 'Team URL is missing';
        this.isLoading = false;
      }
    });
  }

  loadTeamData(): void {

    this.teamService.getTeamByUrl(this.teamUrl)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: this.handleTeamDataLoaded.bind(this),
        error: this.handleTeamDataError.bind(this)
      });
  }

  private updateFormControlsBasedOnRole(): void {
    if (this.currentUserRole !== 'Owner') {
      this.teamForm.get('teamName')?.disable();
    } else {
      this.teamForm.get('teamName')?.enable();
    }
  }

  loadUserRole(userId: string): void {
    this.teamMemberService.getTeamMembers(this.teamId)
      .subscribe({
        next: (members: TeamMember[]) => {
          const currentMember = members.find(m => m.userId === userId);
          if (currentMember) {
            this.currentUserRole = currentMember.role;
            this.updateFormControlsBasedOnRole();
          }
        },
        error: (err) => {
          console.error('Error loading team members:', err);
        }
      });
  }

  private handleTeamDataLoaded(team: any): void {
    this.teamId = team.id || '';
    this.teamName = team.name;

    const urlSuffix = this.extractOrGenerateUrlSuffix(team);

    this.teamForm.patchValue({
      teamName: team.name,
      teamURL: this.BASE_URL + urlSuffix
    });

    this.setupNameChangeListener();
    this.error = null;

    const user = this.authService.user$.getValue();
    if (user) {
      this.loadUserRole(user.uid);
    } else {
      this.teamForm.get('teamName')?.disable();
    }
  }

  private extractOrGenerateUrlSuffix(team: any): string {
    if (team.url) {
      if (team.url.startsWith(this.BASE_URL)) {
        return team.url.substring(this.BASE_URL.length);
      }
      return team.url;
    }

    return this.formatUrlFromName(team.name);
  }

  private formatUrlFromName(name: string): string {
    return name.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  private handleTeamDataError(err: any): void {
    this.error = 'Failed to load team details. Please try again.';
  }

  setupNameChangeListener(): void {
    if (this.nameChangeSubscription) {
      this.nameChangeSubscription.unsubscribe();
    }

    const nameControl = this.teamForm.get('teamName');
    if (nameControl) {
      this.nameChangeSubscription = nameControl.valueChanges.subscribe(value => {
        if (value) {
          const urlSuffix = this.formatUrlFromName(value);
          this.teamForm.get('teamURL')?.setValue(this.BASE_URL + urlSuffix);
        } else {
          this.teamForm.get('teamURL')?.setValue(this.BASE_URL);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.teamForm.invalid) {
      return;
    }

    if (!this.teamId) {
      this.error = 'Team ID is missing';
      return;
    }

    const formValues = this.teamForm.getRawValue();
    const updatedTeam = {
      name: formValues.teamName,
      url: formValues.teamURL
    };

    this.isLoading = true;

    this.teamService.updateTeam(this.teamId, updatedTeam)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: this.handleTeamUpdated.bind(this),
        error: this.handleTeamUpdateError.bind(this)
      });
  }

  private handleTeamUpdated(team: any): void {
    this.teamName = team.name;
    this.teamUrl = team.url || '';
  }

  private handleTeamUpdateError(err: any): void {
    this.error = 'Failed to update team. Please try again.';
  }

  confirmDeleteTeam(): void {
    this.showDeleteConfirmation = true;
  }

  cancelDeleteTeam(): void {
    this.showDeleteConfirmation = false;
  }

  deleteTeam(): void {
    if (!this.teamId) {
      this.error = 'Team ID is missing';
      return;
    }

    this.isDeleting = true;

    this.teamService.deleteTeam(this.teamId)
      .pipe(
        finalize(() => {
          this.isDeleting = false;
          this.showDeleteConfirmation = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.error = 'Failed to delete team. Please try again.';
        }
      });
  }

  getFormControl(name: string): FormControl {
    return this.teamForm.get(name) as FormControl;
  }

  private unsubscribeAll(): void {
    if (this.nameChangeSubscription) {
      this.nameChangeSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}
