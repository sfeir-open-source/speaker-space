import {Component, OnInit, viewChild, ElementRef, inject, signal, DestroyRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SidebarTeamComponent } from '../../../components/team/sidebar-team/sidebar-team.component';
import { MembersCardComponent } from '../../../components/team/members-card/members-card.component';
import { NavbarTeamPageComponent } from '../../../components/team/navbar-team-page/navbar-team-page.component';
import { AddMemberComponent } from '../../../components/team/add-member/add-member.component';

import { TeamMember } from '../../../type/team/team-member';
import { TeamService } from '../../../services/team/team.service';
import { TeamMemberService } from '../../../services/team/team-member.service';
import { AuthService } from '../../../../../core/login/services/auth.service';
import { UserRoleService } from '../../../services/team/user-role.service';
import { InvitationService } from '../../../services/team/invitation.service';
import {finalize} from 'rxjs/operators';

@Component({
  selector: 'app-setting-team-members-page',
  standalone: true,
  imports: [
    CommonModule,
    MembersCardComponent,
    NavbarTeamPageComponent,
    SidebarTeamComponent,
    AddMemberComponent,
  ],
  templateUrl: './setting-team-members-page.component.html',
  styleUrl: './setting-team-members-page.component.scss'
})
export class SettingTeamMembersPageComponent implements OnInit {
  readonly formSubmitElement = viewChild<ElementRef<HTMLFormElement>>('formSubmit');

  readonly teamId = signal<string>('');
  readonly teamName = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly teamMembers = signal<TeamMember[]>([]);
  readonly isDeleting = signal<boolean>(false);
  readonly currentUserRole = signal<string>('');
  readonly isCreator = signal<boolean>(false);
  readonly currentUserId = signal<string>('');

  private readonly route = inject(ActivatedRoute);
  private readonly teamService = inject(TeamService);
  private readonly teamMemberService = inject(TeamMemberService);
  private readonly authService = inject(AuthService);
  private readonly userRoleService = inject(UserRoleService);
  protected readonly invitationService = inject(InvitationService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.setupTeamDataSubscription();
  }

  ngOnInit(): void {
    this.loadTeamData();
  }

  private setupTeamDataSubscription(): void {
    this.authService.user$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(user => {
          if (!user) {
            this.isLoading.set(false);
            return [];
          }

          this.currentUserId.set(user.uid);
          return this.route.paramMap.pipe(
            switchMap(params => {
              const teamIdParam = params.get('teamId') || '';
              return this.teamService.getTeamByUrl(teamIdParam);
            }),
            switchMap(team => {
              this.teamId.set(team.id || '');
              this.teamName.set(team.name);
              this.isCreator.set(team.userCreateId === this.currentUserId());
              return this.teamMemberService.getTeamMembers(team.id || '');
            })
          );
        })
      )
      .subscribe({
        next: (members: TeamMember[]) => {
          this.teamMembers.set(members);
          this.updateCurrentUserRole(members);
          this.isLoading.set(false);
          this.error.set(null);
        },
        error: () => {
          this.isLoading.set(false);
          this.error.set('Failed to load team data. Please try again.');
        }
      });
  }

  private loadTeamData(): void {
    this.isLoading.set(true);
  }

  private updateCurrentUserRole(members: TeamMember[]): void {
    const currentMember = members.find(m => m.userId === this.currentUserId());
    if (currentMember) {
      this.currentUserRole.set(currentMember.role ?? 'Member');
      this.userRoleService.setRole(currentMember.role ?? 'Member');
    }
  }

  onMemberAdded(member: TeamMember): void {
    this.teamMembers.set([...this.teamMembers(), member]);
    this.error.set(null);
  }

  onInvitationSent(data: {email: string, teamName: string, teamId: string, inviterName: string}): void {
    this.invitationService.sendInvitation(
      data.email,
      data.teamName,
      data.teamId,
      data.inviterName,
      this.formSubmitElement()
    );
  }

  onError(errorMessage: string): void {
    this.error.set(errorMessage);
  }

  deleteMember(member: TeamMember): void {
    this.isDeleting.set(true);

    this.teamMemberService.removeTeamMember(this.teamId(), member.userId)
      .pipe(
        finalize(() => this.isDeleting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          const updatedMembers = this.teamMembers().filter(m => m.userId !== member.userId);
          this.teamMembers.set(updatedMembers);
          this.error.set(null);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to remove team member');
        }
      });
  }

  updateMemberRole(data: { member: TeamMember, newRole: string }): void {
    const { member, newRole } = data;

    if (!this.canUpdateRole(member, newRole)) return;

    this.isLoading.set(true);

    this.teamMemberService.updateMemberRole(this.teamId(), member.userId, newRole)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updatedMember: TeamMember) => {
          const updatedMembers = this.teamMembers().map(m =>
            m.userId === updatedMember.userId ? updatedMember : m
          );
          this.teamMembers.set(updatedMembers);
          this.error.set(null);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to update member role');
        }
      });
  }

  private canUpdateRole(member: TeamMember, newRole: string): boolean {
    if (this.currentUserRole() !== 'Owner') {
      this.error.set('Only Owners can change member roles');
      return false;
    }

    if (member.userId === this.currentUserId()) {
      this.error.set('You cannot change your own role');
      return false;
    }

    if (member.role === 'Owner' && newRole === 'Member') {
      const ownerCount = this.teamMembers().filter(m => m.role === 'Owner').length;
      if (ownerCount <= 1) {
        this.error.set('Cannot demote the last Owner. Promote another member to Owner first.');
        return false;
      }
    }

    return true;
  }
}
