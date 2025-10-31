import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavbarTeamPageComponent } from '../../../components/team/navbar-team-page/navbar-team-page.component';
import { SidebarTeamComponent } from '../../../components/team/sidebar-team/sidebar-team.component';
import { DangerZoneComponent } from '../../../components/danger-zone/danger-zone.component';
import { DeleteConfirmationPopupComponent } from '../../../components/delete-confirmation-popup/delete-confirmation-popup.component';
import { DeleteConfirmationConfig } from '../../../type/components/delete-confirmation';
import { DangerZoneConfig } from '../../../type/components/danger-zone';
import {TeamGeneralFormComponent} from '../../../components/team/team-general-form/team-general-form.component';
import {TeamFormData, TeamFormService} from '../../../services/team/team-form.service';
import {TeamManagementService} from '../../../services/team/team-management.service';
import {TeamData} from '../../../type/team/team-data';

@Component({
  selector: 'app-setting-team-general-page',
  standalone: true,
  imports: [
    NavbarTeamPageComponent,
    FormsModule,
    SidebarTeamComponent,
    DangerZoneComponent,
    DeleteConfirmationPopupComponent,
    TeamGeneralFormComponent
  ],
  templateUrl: './setting-team-general-page.component.html',
  styleUrl: './setting-team-general-page.component.scss'
})

export class SettingTeamGeneralPageComponent implements OnInit {
  readonly activeSection = signal<string>('settings-general');
  readonly teamUrl = signal<string>('');
  readonly teamId = signal<string>('');
  readonly teamName = signal<string>('');
  readonly isDeleting = signal<boolean>(false);
  readonly showDeleteConfirmation = signal<boolean>(false);
  readonly currentUserRole = signal<string>('');

  readonly teamFormData = computed<TeamFormData>(() => ({
    teamName: this.teamName(),
    teamURL: this.teamUrl()
  }));

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
  readonly teamManagementService = inject(TeamManagementService);
  private readonly teamFormService = inject(TeamFormService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.activeSection.set('settings-general');
    this.checkForEmailModal();
    this.subscribeToRouteParams();
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
          this.loadTeamData(teamIdParam);
          this.loadUserRole(teamIdParam);
        } else {
          this.teamManagementService.setError('Team ID is missing');
        }
      });
  }

  private loadTeamData(teamId: string): void {
    this.teamManagementService.loadTeamData(teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (team: TeamData) => {
          this.teamId.set(team.id);
          this.teamName.set(team.name);
          this.teamUrl.set(team.url);
          this.teamManagementService.clearError();
        },
        error: () => {
          this.teamManagementService.setError('Failed to load team details. Please try again.');
        }
      });
  }

  private loadUserRole(teamId: string): void {
    this.teamManagementService.getCurrentUserRole(teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (role: string) => {
          this.currentUserRole.set(role);
        },
        error: () => {
          console.error('Error loading user role');
        }
      });
  }

  onFormSubmitted(formData: TeamFormData): void {
    if (!this.teamId()) {
      this.teamManagementService.setError('Team ID is missing');
      return;
    }

    const updateData = {
      name: formData.teamName,
      url: formData.teamURL
    };

    this.teamManagementService.updateTeam(this.teamId(), updateData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (team: TeamData) => {
          this.teamName.set(team.name);
          this.teamUrl.set(team.url);
          this.teamManagementService.clearError();
        },
        error: () => {
          this.teamManagementService.setError('Failed to update team. Please try again.');
        }
      });
  }

  onFormError(error: string): void {
    this.teamManagementService.setError(error);
  }

  onDangerZoneDelete(): void {
    this.showDeleteConfirmation.set(true);
  }

  onDeleteConfirmed(): void {
    if (!this.teamId()) {
      this.teamManagementService.setError('Team ID is missing');
      return;
    }

    this.isDeleting.set(true);

    this.teamManagementService.deleteTeam(this.teamId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: () => {
          this.teamManagementService.setError('Failed to delete team. Please try again.');
          this.isDeleting.set(false);
          this.showDeleteConfirmation.set(false);
        },
        complete: () => {
          this.isDeleting.set(false);
          this.showDeleteConfirmation.set(false);
        }
      });
  }

  onDeleteCancelled(): void {
    this.showDeleteConfirmation.set(false);
  }
}
