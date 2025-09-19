import { Component, OnInit, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FieldComponent } from '../../../../../shared/input/field.component';
import { NavbarTeamPageComponent } from '../../../components/team/navbar-team-page/navbar-team-page.component';
import { SidebarTeamComponent } from '../../../components/team/sidebar-team/sidebar-team.component';
import { FormField } from '../../../../../shared/input/interface/form-field';
import { TeamService } from '../../../services/team/team.service';
import { TeamMemberService } from '../../../services/team/team-member.service';
import { AuthService } from '../../../../../core/login/services/auth.service';
import { TeamMember } from '../../../type/team/team-member';
import { DangerZoneComponent } from '../../../components/danger-zone/danger-zone.component';
import { DeleteConfirmationPopupComponent } from '../../../components/delete-confirmation-popup/delete-confirmation-popup.component';
import { DeleteConfirmationConfig } from '../../../type/components/delete-confirmation';
import { DangerZoneConfig } from '../../../type/components/danger-zone';

@Component({
  selector: 'app-setting-team-general-page',
  standalone: true,
  imports: [
    FieldComponent,
    NavbarTeamPageComponent,
    FormsModule,
    SidebarTeamComponent,
    DangerZoneComponent,
    DeleteConfirmationPopupComponent
  ],
  templateUrl: './setting-team-general-page.component.html',
  styleUrl: './setting-team-general-page.component.scss'
})
export class SettingTeamGeneralPageComponent implements OnInit {
  readonly activeSection = signal<string>('settings-general');
  readonly teamUrl = signal<string>('');
  readonly teamId = signal<string>('');
  readonly teamName = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly isDeleting = signal<boolean>(false);
  readonly showDeleteConfirmation = signal<boolean>(false);
  readonly currentUserRole = signal<string>('');

  teamForm: FormGroup;

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

  readonly dangerZoneConfig = computed<DangerZoneConfig>(() => ({
    title: 'Danger zone',
    entityName: this.teamName(),
    entityType: 'team',
    showArchiveSection: false,
    isDeleting: this.isDeleting(),
    currentUserRole: this.currentUserRole()
  }));

  readonly deleteConfirmationConfig = computed<DeleteConfirmationConfig>(() => ({
    entityType: 'team',
    entityName: this.teamName(),
    title: 'Confirm Team Deletion',
    confirmButtonText: 'Delete permanently',
    loadingText: 'Deleting...',
    requireTextConfirmation: true,
    confirmationText: 'DELETE'
  }));

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamService = inject(TeamService);
  private readonly teamMemberService = inject(TeamMemberService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.teamForm = this.initializeForm();

    effect(() => {
      this.updateFormControlsBasedOnRole();
    });

    effect(() => {
      this.setupNameChangeListener();
    });
  }

  ngOnInit(): void {
    this.activeSection.set('settings-general');
    this.isLoading.set(true);
    this.checkForEmailModal();
    this.subscribeToRouteParams();
    this.subscribeToUserChanges();
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      teamName: [{ value: '', disabled: false }, Validators.required],
      teamURL: { value: '', disabled: true }
    });
  }

  private checkForEmailModal(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const showEmailModal = params['showEmailModal'];
        if (showEmailModal === 'true') {
          const modal = document.getElementById('crud-modal');
          modal?.classList.remove('hidden');
        }
      });
  }

  private subscribeToRouteParams(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const teamIdParam = params.get('teamId') || '';
        this.teamId.set(teamIdParam);

        if (teamIdParam) {
          this.loadTeamData();
        } else {
          this.error.set('Team ID is missing');
          this.isLoading.set(false);
        }
      });
  }

  private subscribeToUserChanges(): void {
    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        if (user && this.teamId()) {
          this.loadUserRole(user.uid);
        }
      });
  }

  private loadTeamData(): void {
    this.teamService.getTeamByUrl(this.teamId())
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (team) => this.handleTeamDataLoaded(team),
        error: (err) => this.handleTeamDataError(err)
      });
  }

  private updateFormControlsBasedOnRole(): void {
    const nameControl = this.teamForm.get('teamName');
    if (!nameControl) return;

    if (this.currentUserRole() !== 'Owner') {
      nameControl.disable();
    } else {
      nameControl.enable();
    }
  }

  private loadUserRole(userId: string): void {
    this.teamMemberService.getTeamMembers(this.teamId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (members: TeamMember[]) => {
          const currentMember = members.find(m => m.userId === userId);
          if (currentMember) {
            this.currentUserRole.set(currentMember.role);
          }
        },
        error: (err) => {
          console.error('Error loading team members:', err);
        }
      });
  }

  private handleTeamDataLoaded(team: any): void {
    this.teamId.set(team.id || '');
    this.teamName.set(team.name);

    this.teamForm.patchValue({
      teamName: team.name,
      teamURL: team.id
    });

    this.error.set(null);
  }

  private formatUrlFromName(name: string): string {
    return name.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  private handleTeamDataError(err: any): void {
    this.error.set('Failed to load team details. Please try again.');
  }

  private setupNameChangeListener(): void {
    const nameControl = this.teamForm.get('teamName');
    if (nameControl) {
      nameControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(value => {
          if (value) {
            const urlSuffix = this.formatUrlFromName(value);
            this.teamForm.get('teamId')?.setValue(urlSuffix);
          }
        });
    }
  }

  onSubmit(): void {
    if (this.teamForm.invalid || !this.teamId()) {
      this.error.set('Team ID is missing or form is invalid');
      return;
    }

    const formValues = this.teamForm.getRawValue();
    const updatedTeam = {
      name: formValues.teamName,
      url: formValues.teamURL
    };

    this.isLoading.set(true);

    this.teamService.updateTeam(this.teamId(), updatedTeam)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (team) => this.handleTeamUpdated(team),
        error: (err) => this.handleTeamUpdateError(err)
      });
  }

  private handleTeamUpdated(team: any): void {
    this.teamName.set(team.name);
    this.teamUrl.set(team.url || '');
  }

  private handleTeamUpdateError(err: any): void {
    this.error.set('Failed to update team. Please try again.');
  }

  confirmDeleteTeam(): void {
    this.showDeleteConfirmation.set(true);
  }

  cancelDeleteTeam(): void {
    this.showDeleteConfirmation.set(false);
  }

  deleteTeam(): void {
    if (!this.teamId()) {
      this.error.set('Team ID is missing');
      return;
    }

    this.isDeleting.set(true);

    this.teamService.deleteTeam(this.teamId())
      .pipe(
        finalize(() => {
          this.isDeleting.set(false);
          this.showDeleteConfirmation.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.error.set('Failed to delete team. Please try again.');
        }
      });
  }

  getFormControl(name: string): FormControl {
    return this.teamForm.get(name) as FormControl;
  }

  onDangerZoneDelete(): void {
    this.confirmDeleteTeam();
  }

  onDeleteConfirmed(): void {
    this.deleteTeam();
  }

  onDeleteCancelled(): void {
    this.cancelDeleteTeam();
  }
}
