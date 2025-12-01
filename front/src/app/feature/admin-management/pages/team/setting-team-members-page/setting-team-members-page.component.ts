import {
  Component,
  OnInit,
  viewChild,
  input,
  ElementRef,
  inject,
  DestroyRef,
  signal,
  effect
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, switchMap, take, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';
import { SidebarTeamComponent } from '../../../components/team/sidebar-team/sidebar-team.component';
import { MembersCardComponent } from '../../../components/team/members-card/members-card.component';
import { AutocompleteComponent } from '../../../components/auto-complete/auto-complete.component';
import { NavbarTeamPageComponent } from '../../../components/team/navbar-team-page/navbar-team-page.component';
import { TeamMember } from '../../../type/team/team-member';
import { FormSubmitData } from '../../../type/team/form-submit-data';
import { TeamService } from '../../../services/team/team.service';
import { TeamMemberService } from '../../../services/team/team-member.service';
import { AuthService } from '../../../../../core/login/services/auth.service';
import { UserRoleService } from '../../../services/team/user-role.service';
import { FormField } from '../../../../../shared/input/interface/form-field';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {ButtonComponent} from '../../../../../shared/button/button.component';

@Component({
  selector: 'app-setting-team-members-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MembersCardComponent,
    AutocompleteComponent,
    NavbarTeamPageComponent,
    SidebarTeamComponent,
    ButtonComponent,
  ],
  templateUrl: './setting-team-members-page.component.html',
  styleUrl: './setting-team-members-page.component.scss'
})
export class SettingTeamMembersPageComponent implements OnInit {
  readonly member = input<TeamMember>();
  readonly formSubmitData = input<FormSubmitData>();

  readonly formSubmitElement = viewChild<ElementRef<HTMLFormElement>>('formSubmit');

  readonly activeSection = signal<string>('settings-members');
  readonly teamUrl = signal<string>('');
  readonly teamId = signal<string>('');
  readonly teamName = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly teamMembers = signal<TeamMember[]>([]);
  readonly isDeleting = signal<boolean>(false);
  readonly isSearching = signal<boolean>(false);
  readonly selectedUser = signal<TeamMember | null>(null);
  readonly isAddingMember = signal<boolean>(false);
  readonly currentUserRole = signal<string>('');
  readonly isCreator = signal<boolean>(false);
  readonly currentUserId = signal<string>('');
  readonly searchResults = signal<TeamMember[]>([]);
  readonly currentTeamMembers = signal<TeamMember[]>([]);
  readonly formSubmitDataInternal = signal<FormSubmitData | undefined>(undefined);

  readonly searchControl = new FormControl('');

  readonly field: FormField = {
    name: 'findmembers',
    placeholder: 'Find member by email',
    icon: 'search',
    type: 'text',
  };

  private readonly route = inject(ActivatedRoute);
  private readonly teamService = inject(TeamService);
  private readonly teamMemberService = inject(TeamMemberService);
  private readonly authService = inject(AuthService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const role = this.currentUserRole();
      if (role) {
        this.userRoleService.setRole(role);
      }
    });

    this.setupSearchListener();
  }

  ngOnInit(): void {
    this.activeSection.set('settings-members');
    this.isLoading.set(true);

    this.authService.user$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(user => {
          if (!user) {
            return [];
          }
          this.currentUserId.set(user.uid);

          return this.route.paramMap.pipe(
            switchMap(params => {
              const teamIdParam = params.get('teamId') || '';
              this.teamId.set(teamIdParam);

              if (!teamIdParam) {
                this.error.set('Team ID is missing');
                this.isLoading.set(false);
                return [];
              }

              return this.teamService.getTeamByUrl(teamIdParam).pipe(
                switchMap(team => {
                  this.teamId.set(team.id || '');
                  this.teamName.set(team.name);
                  this.isCreator.set(team.userCreateId === this.currentUserId());

                  if (!team.id) {
                    this.error.set('Team ID is missing');
                    this.isLoading.set(false);
                    return [];
                  }

                  return this.teamMemberService.getTeamMembers(team.id);
                })
              );
            })
          );
        })
      )
      .subscribe({
        next: (members: TeamMember[]) => {
          this.teamMembers.set(members);
          this.currentTeamMembers.set([...members]);

          const currentMember = members.find(m => m.userId === this.currentUserId());
          if (currentMember) {
            this.currentUserRole.set(currentMember.role ?? 'Member');
          }

          this.isLoading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set('Failed to load team data. Please try again.');
          console.error('Error:', err);
        }
      });
  }

  onSearchInputChanged(query: string): void {
    if (!query || query.length < 2) {
      this.selectedUser.set(null);
    }
  }

  private setupSearchListener(): void {
    this.searchControl.valueChanges
      .pipe(
        tap(query => {
          if (!query || query.length < 2) {
            this.searchResults.set([]);
            this.isSearching.set(false);
            this.selectedUser.set(null);
          }
        }),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
        switchMap(query => {
          if (!query || query.length < 2) {
            return [];
          }

          this.isSearching.set(true);

          return this.teamMemberService.searchUsersByEmail(query).pipe(
            finalize(() => this.isSearching.set(false))
          );
        })
      )
      .subscribe({
        next: (results) => {
          if (Array.isArray(results)) {
            const filteredResults = results.filter(user =>
              !this.currentTeamMembers().some(member => member.userId === user.userId)
            );
            this.searchResults.set(filteredResults);
          } else {
            this.searchResults.set([]);
          }
        },
        error: (err) => {
          this.error.set('Error searching for users');
          this.searchResults.set([]);
        }
      });
  }

  selectUser(user: TeamMember): void {
    this.selectedUser.set(user);
    this.searchControl.setValue(user.email);
  }

  addMember(): void {
    if (this.currentUserRole() !== 'Owner') {
      this.error.set('Only Owners can add members');
      return;
    }

    const email = this.searchControl.value;
    const selectedUser = this.selectedUser();

    if (selectedUser && this.teamId()) {
      this.isAddingMember.set(true);

      const newMember: TeamMember = {
        userId: selectedUser.userId,
        email: selectedUser.email,
        displayName: selectedUser.displayName || '',
        photoURL: selectedUser.photoURL || '',
        role: 'Member'
      };

      this.teamMemberService.addTeamMember(this.teamId(), newMember, this.teamName())
        .pipe(
          finalize(() => this.isAddingMember.set(false)),
          switchMap(addedMember => {
            return this.authService.user$.pipe(
              take(1),
              map(currentUser => {
                const inviterName = currentUser?.displayName || 'Un membre de l\'équipe';

                this.submitFormSubmit(
                  newMember.email,
                  this.teamName(),
                  this.teamId(),
                  inviterName
                );

                return addedMember;
              })
            );
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (addedMember) => {
            this.currentTeamMembers.set([...this.currentTeamMembers(), addedMember]);
            this.searchControl.setValue('');
            this.selectedUser.set(null);
            this.error.set(null);
          },
          error: (err) => {
            this.error.set(err.message || 'Failed to add team member. Please try again.');
          }
        });
    } else if (email && this.validateEmail(email)) {
      this.inviteMemberByEmail();
    } else {
      this.error.set('Please select a user or enter a valid email address');
    }
  }

  submitFormSubmit(email: string, teamName: string, teamId: string, inviterName: string): void {
    const baseUrl = window.location.origin;
    const invitationLink = `${baseUrl}/login`;

    const message = `
    Hello,

    You have been invited by ${inviterName} to join the team "${teamName}".

    Click on this link to connect with your email: "${invitationLink}".

    Best regards,`;

    this.formSubmitDataInternal.set({
      email: email,
      subject: `Invitation to join "${teamName}" team on Speaker Space by ${inviterName}`,
      message: message,
      inviterName: inviterName,
      teamName: teamName,
      invitationLink: invitationLink,
      autoresponse: ''
    });

    setTimeout(() => {
      const formElement = this.formSubmitElement();
      if (formElement?.nativeElement) {
        formElement.nativeElement.submit();
      }
    }, 100);
  }

  deleteMember(member: TeamMember): void {
    this.isDeleting.set(true);
    const userId: string = member.userId;

    this.teamMemberService.removeTeamMember(this.teamId(), userId)
      .pipe(
        finalize(() => {
          this.isDeleting.set(false);
          this.selectedUser.set(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          const updatedMembers = this.currentTeamMembers().filter(m => m.userId !== userId);
          this.currentTeamMembers.set(updatedMembers);
          this.teamMembers.set(this.teamMembers().filter(m => m.userId !== userId));
          this.error.set(null);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to remove team member. Please try again.');
        }
      });
  }

  updateMemberRole(data: { member: TeamMember, newRole: string }): void {
    const { member, newRole } = data;

    if (!this.teamId()) {
      this.error.set('Team ID is missing');
      return;
    }

    if (this.currentUserRole() !== 'Owner') {
      this.error.set('Only Owners can change member roles');
      return;
    }

    if (member.userId === this.currentUserId()) {
      this.error.set('You cannot change your own role');
      return;
    }

    if (member.role === 'Owner' && newRole === 'Member') {
      const ownerCount: number = this.currentTeamMembers().filter(m => m.role === 'Owner').length;
      if (ownerCount <= 1) {
        this.error.set('Cannot demote the last Owner. Promote another member to Owner first.');
        return;
      }
    }

    this.isLoading.set(true);

    this.teamMemberService.updateMemberRole(this.teamId(), member.userId, newRole)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updatedMember: TeamMember) => {
          const updatedCurrentMembers = this.currentTeamMembers().map(m =>
            m.userId === updatedMember.userId ? updatedMember : m
          );
          this.currentTeamMembers.set(updatedCurrentMembers);

          const updatedTeamMembers = this.teamMembers().map(m =>
            m.userId === updatedMember.userId ? updatedMember : m
          );
          this.teamMembers.set(updatedTeamMembers);

          this.error.set(null);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to update member role. Please try again.');
        }
      });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.addMember();
  }

  inviteMemberByEmail(): void {
    const email = this.searchControl.value;

    if (!email || !this.validateEmail(email)) {
      this.error.set('Please enter a valid email address');
      return;
    }

    this.isAddingMember.set(true);
    const normalizedEmail = email.toLowerCase();

    this.teamMemberService.inviteMemberByEmail(this.teamId(), normalizedEmail, this.teamName())
      .pipe(
        finalize(() => this.isAddingMember.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (invitedMember) => {
          this.authService.user$.pipe(
            take(1)
          ).subscribe(currentUser => {
            const inviterName = currentUser?.displayName || 'Un membre de l\'équipe';

            this.submitFormSubmit(
              normalizedEmail,
              this.teamName(),
              this.teamId(),
              inviterName
            );

            this.currentTeamMembers.set([...this.currentTeamMembers(), invitedMember]);
            this.searchControl.setValue('');
            this.error.set(null);
          });
        },
        error: (err) => {
          this.error.set('Failed to invite member. Please try again.');
          console.error('Error inviting member:', err);
        }
      });
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}
