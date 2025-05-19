import {Component, OnInit, OnDestroy, TemplateRef, ViewChild, Input, ElementRef} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {debounceTime, distinctUntilChanged, finalize, Subject, switchMap, take, takeUntil, tap} from 'rxjs';
import { CommonModule } from '@angular/common';
import {map} from 'rxjs/operators';
import {MembersCardComponent} from '../../components/members-card/members-card.component';
import {NavbarTeamPageComponent} from '../../components/navbar-team-page/navbar-team-page.component';
import {TeamSidebarComponent} from '../../components/team-sidebar/team-sidebar.component';
import {ButtonGreenActionsComponent} from '../../../../shared/button-green-actions/button-green-actions.component';
import {AutocompleteComponent} from '../../components/auto-complete/auto-complete.component';
import {AuthService} from '../../../../core/login/services/auth.service';
import {FormField} from '../../../../shared/input/interface/form-field';
import {TeamService} from '../../services/team/team.service';
import {TeamMemberService} from '../../services/team/team-member.service';
import {UserRoleService} from '../../services/team/user-role.service';
import {TeamMember} from '../../type/team/team-member';
import {FormSubmitData} from '../../type/team/form-submit-data';

@Component({
  selector: 'app-setting-team-members-page',
  standalone: true,
  imports: [
    CommonModule,
    NavbarTeamPageComponent,
    TeamSidebarComponent,
    FormsModule,
    ReactiveFormsModule,
    MembersCardComponent,
    ButtonGreenActionsComponent,
    AutocompleteComponent,
  ],
  templateUrl: './setting-team-members-page.component.html',
  styleUrl: './setting-team-members-page.component.scss'
})
export class SettingTeamMembersPageComponent implements OnInit, OnDestroy {
  @Input() member!: TeamMember;
  @Input() formSubmitData: FormSubmitData | undefined;
  @ViewChild('formSubmit') formSubmitElement!: ElementRef<HTMLFormElement>;

  activeSection: string = 'settings-members';
  teamUrl: string = '';
  teamId: string = '';
  teamName: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  teamMembers: TeamMember[] = [];
  showDeleteConfirmation: boolean = false;
  isDeleting: boolean = false;
  searchControl = new FormControl('');
  isSearching: boolean = false;
  selectedUser: TeamMember | null = null;
  isAddingMember: boolean = false;
  currentUserRole: string = '';
  isCreator: boolean = false;
  currentUserId: string = '';
  searchResults: TeamMember[] = [];
  currentTeamMembers: TeamMember[] = [];

  private destroy$ = new Subject<void>();

  @ViewChild('userItemTemplate') userItemTemplate!: TemplateRef<any>;

  constructor(
    private route: ActivatedRoute,
    private teamService: TeamService,
    private teamMemberService: TeamMemberService,
    private authService: AuthService,
    private userRoleService: UserRoleService
  ) {}

  ngOnInit() {
    this.activeSection = 'settings-members';
    this.isLoading = true;

    this.authService.user$.subscribe(user => {
      if (user) {
        this.currentUserId = user.uid;
      }
    });

    this.authService.user$.pipe(
      takeUntil(this.destroy$),
      switchMap(user => {
        if (!user) {
          return [];
        }
        this.currentUserId = user.uid;

        return this.route.paramMap.pipe(
          switchMap(params => {
            this.teamUrl = params.get('teamUrl') || '';
            if (!this.teamUrl) {
              this.error = 'Team URL is missing';
              this.isLoading = false;
              return [];
            }

            return this.teamService.getTeamByUrl(this.teamUrl).pipe(
              switchMap(team => {
                this.teamId = team.id || '';
                this.teamName = team.name;
                this.isCreator = team.userCreateId === this.currentUserId;

                if (!this.teamId) {
                  this.error = 'Team ID is missing';
                  this.isLoading = false;
                  return [];
                }

                return this.teamMemberService.getTeamMembers(this.teamId);
              })
            );
          })
        );
      })
    ).subscribe({
      next: (members: TeamMember[]) => {
        this.teamMembers = members;
        this.currentTeamMembers = [...members];

        const currentMember = this.teamMembers.find(m => m.userId === this.currentUserId);
        if (currentMember) {
          this.currentUserRole = currentMember.role ?? 'Member';
          this.userRoleService.setRole(this.currentUserRole);
        }

        this.isLoading = false;
        this.error = null;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Failed to load team data. Please try again.';
        console.error('Error:', err);
      }
    });

    this.setupSearchListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInputChanged(query: string): void {
    if (!query || query.length < 2) {
      this.selectedUser = null;
    }
  }

  setupSearchListener() {
    this.searchControl.valueChanges.pipe(
      tap(query => {
        if (!query || query.length < 2) {
          this.searchResults  = [];
          this.isSearching = false;
          this.selectedUser = null;
        }
      }),
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap(query => {
        if (!query || query.length < 2) {
          return [];
        }

        this.isSearching = true;

        return this.teamMemberService.searchUsersByEmail(query).pipe(
          finalize(() => this.isSearching = false)
        );
      })
    ).subscribe({
      next: (results) => {
        if (Array.isArray(results)) {
          this.searchResults = results.filter(user =>
            !this.currentTeamMembers.some(member => member.userId === user.userId)
          );
        } else {
          this.teamMembers = [];
        }
      },
      error: (err) => {
        this.error = 'Error searching for users';
        this.teamMembers = [];
      }
    });
  }

  selectUser(user: TeamMember) {
    this.selectedUser = user;
    this.searchControl.setValue(user.email);
  }

  addMember() {
    if (this.currentUserRole !== 'Owner') {
      this.error = 'Only Owners can add members';
      return;
    }

    const email = this.searchControl.value;

    if (this.selectedUser && this.teamId) {
      this.isAddingMember = true;

      const newMember: TeamMember = {
        userId: this.selectedUser.userId,
        email: this.selectedUser.email,
        displayName: this.selectedUser.displayName || '',
        photoURL: this.selectedUser.photoURL || '',
        role: 'Member'
      };

      this.teamMemberService.addTeamMember(this.teamId, newMember, this.teamName)
        .pipe(
          finalize(() => this.isAddingMember = false),
          switchMap(addedMember => {
            return this.authService.user$.pipe(
              take(1),
              map(currentUser => {
                const inviterName = currentUser?.displayName || 'Un membre de l\'équipe';

                this.submitFormSubmit(
                  newMember.email,
                  this.teamName,
                  this.teamId,
                  inviterName
                );

                return addedMember;
              })
            );
          })
        )
        .subscribe({
          next: (addedMember) => {
            this.currentTeamMembers = [...this.currentTeamMembers, addedMember];
            this.searchControl.setValue('');
            this.selectedUser = null;
            this.error = null;
          },
          error: (err) => {
            this.error = err.message || 'Failed to add team member. Please try again.';
          }
        });
    } else if (email && this.validateEmail(email)) {
      this.inviteMemberByEmail();
    } else {
      this.error = 'Please select a user or enter a valid email address';
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

    this.formSubmitData = {
      email: email,
      subject: `Invitation to join "${teamName}" team on Speaker Space by ${inviterName}`,
      message: message,
      inviterName: inviterName,
      teamName: teamName,
      invitationLink: invitationLink,
      autoresponse: ''
    };

    setTimeout(() => {
      if (this.formSubmitElement && this.formSubmitElement.nativeElement) {
        this.formSubmitElement.nativeElement.submit();
      }
    }, 100);
  }

  loadTeamMembers(): void {
    this.teamMemberService.getTeamMembers(this.teamId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (members: TeamMember[]) => {
          this.teamMembers = members;
          this.currentTeamMembers = [...members];
          const currentMember = this.teamMembers.find(m => m.userId === this.currentUserId);
          if (currentMember) {
            this.currentUserRole = currentMember.role ?? 'Member';
            this.userRoleService.setRole(this.currentUserRole);
          }
          this.error = null;
        },
        error: (err: any) => {
          this.error = 'Failed to load team members. Please try again.';
          console.error('Error loading team members:', err);
        }
      });
  }

  confirmDeleteMember(member: TeamMember): void {
    this.selectedUser = member;
  }

  cancelDeleteMember(): void {
    this.selectedUser = null;
    this.showDeleteConfirmation = false;
  }

  deleteMember(member: TeamMember): void {
    this.isDeleting = true;
    const userId : string = member.userId;

    this.teamMemberService.removeTeamMember(this.teamId, userId)
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.selectedUser = null;
      }))
      .subscribe({
        next: () => {
          this.currentTeamMembers = this.currentTeamMembers.filter(m => m.userId !== userId);
          this.teamMembers = this.teamMembers.filter(m => m.userId !== userId);
          this.error = null;
        },
        error: (err) => {
          this.error = err.message || 'Failed to remove team member. Please try again.';
        }
      });
  }

  updateMemberRole(data: {member: TeamMember, newRole: string}): void {
    const { member, newRole } = data;

    if (!this.teamId) {
      this.error = 'Team ID is missing';
      return;
    }

    if (this.currentUserRole !== 'Owner') {
      this.error = 'Only Owners can change member roles';
      return;
    }

    if (member.userId === this.currentUserId) {
      this.error = 'You cannot change your own role';
      return;
    }

    if (member.role === 'Owner' && newRole === 'Member') {
      const ownerCount : number = this.currentTeamMembers.filter(m => m.role === 'Owner').length;
      if (ownerCount <= 1) {
        this.error = 'Cannot demote the last Owner. Promote another member to Owner first.';
        return;
      }
    }

    this.isLoading = true;

    this.teamMemberService.updateMemberRole(this.teamId, member.userId, newRole)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedMember: TeamMember) => {
          this.currentTeamMembers = this.currentTeamMembers.map(m =>
            m.userId === updatedMember.userId ? updatedMember : m
          );
          this.teamMembers = this.teamMembers.map(m =>
            m.userId === updatedMember.userId ? updatedMember : m
          );
          this.error = null;
        },
        error: (err) => {
          this.error = err.message || 'Failed to update member role. Please try again.';
        }
      });
  }

  handleBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'delete-modal') {
      this.cancelDeleteMember();
    }
  }

  field: FormField = {
    name: 'findmembers',
    placeholder: 'Find member by email',
    icon: 'search',
    type: 'text',
  };

  onSubmit(event: Event) {
    event.preventDefault();
    this.addMember();
  }

  inviteMemberByEmail() {
    const email = this.searchControl.value;

    if (!email || !this.validateEmail(email)) {
      this.error = 'Please enter a valid email address';
      return;
    }

    this.isAddingMember = true;
    const normalizedEmail = email.toLowerCase();

    this.teamMemberService.inviteMemberByEmail(this.teamId, normalizedEmail, this.teamName)
      .pipe(
        finalize(() => this.isAddingMember = false)
      )
      .subscribe({
        next: (invitedMember) => {
          this.authService.user$.pipe(
            take(1)
          ).subscribe(currentUser => {
            const inviterName = currentUser?.displayName || 'Un membre de l\'équipe';

            this.submitFormSubmit(
              normalizedEmail,
              this.teamName,
              this.teamId,
              inviterName
            );

            this.currentTeamMembers = [...this.currentTeamMembers, invitedMember];
            this.searchControl.setValue('');
            this.error = null;
          });
        },
        error: (err) => {
          this.error = 'Failed to invite member. Please try again.';
          console.error('Error inviting member:', err);
        }
      });
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}
