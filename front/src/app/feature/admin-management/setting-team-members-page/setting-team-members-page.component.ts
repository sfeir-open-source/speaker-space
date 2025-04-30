import {Component, OnInit, OnDestroy, TemplateRef, ViewChild, Input, SimpleChanges} from '@angular/core';
import { NavbarTeamPageComponent } from '../components/navbar-team-page/navbar-team-page.component';
import { TeamSidebarComponent } from '../components/team-sidebar/team-sidebar.component';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../../../shared/input/interface/form-field';
import { ButtonGreenActionsComponent } from '../../../shared/button-green-actions/button-green-actions.component';
import { ActivatedRoute } from '@angular/router';
import { MembersCardComponent } from '../components/members-card/members-card.component';
import { TeamService } from '../services/team.service';
import { TeamMemberService } from '../services/team-member.service';
import { debounceTime, distinctUntilChanged, finalize, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { TeamMember } from '../type/team-member';
import { UserSearchResult } from '../type/user-search-result';
import { CommonModule } from '@angular/common';
import {AutocompleteComponent} from '../components/auto-complete/auto-complete.component';
import {AuthService} from '../../../core/login/services/auth.service';
import {UserRoleService} from '../services/user-role.service';

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

  activeSection: string = 'settings-members';
  teamUrl: string = '';
  teamId: string = '';
  teamName: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  teamMembers: TeamMember[] = [];
  showDeleteConfirmation: boolean = false;
  memberToDelete: TeamMember | null = null;
  isDeleting: boolean = false;
  searchControl = new FormControl('');
  searchResults: UserSearchResult[] = [];
  isSearching: boolean = false;
  selectedUser: UserSearchResult | null = null;
  showSearchResults: boolean = false;
  isAddingMember: boolean = false;
  currentUserRole: string = '';
  isCreator: boolean = false;
  currentUserId: string = '';

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
        const currentMember = this.teamMembers.find(m => m.userId === this.currentUserId);
        if (currentMember) {
          this.currentUserRole = currentMember.role;
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
          this.searchResults = [];
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
            !this.teamMembers.some(member => member.userId === user.userId)
          );
        } else {
          this.searchResults = [];
        }
      },
      error: (err) => {
        this.error = 'Error searching for users';
        this.searchResults = [];
      }
    });
  }

  selectUser(user: UserSearchResult) {
    this.selectedUser = user;
    this.searchControl.setValue(user.email);
  }

  addMember() {
    if (!this.selectedUser || !this.teamId) {
      this.error = 'Please select a user to add';
      return;
    }

    this.isAddingMember = true;

    const newMember: TeamMember = {
      userId: this.selectedUser.userId,
      email: this.selectedUser.email,
      displayName: this.selectedUser.displayName || '',
      photoURL: this.selectedUser.photoURL || '',
      role: 'Member'
    };

    this.teamMemberService.addTeamMember(this.teamId, newMember, this.teamName)
      .pipe(finalize(() => this.isAddingMember = false))
      .subscribe({
        next: (addedMember) => {
          this.teamMembers.push(addedMember);
          this.searchControl.setValue('');
          this.selectedUser = null;
          this.error = null;

          this.loadTeamMembers();
        },
        error: (err) => {
          this.error = err.message || 'Failed to add team member. Please try again.';
        }
      });
  }

  loadTeamMembers(): void {
    this.teamMemberService.getTeamMembers(this.teamId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (members: TeamMember[]) => {
          this.teamMembers = members;
          const currentMember = this.teamMembers.find(m => m.userId === this.currentUserId);
          if (currentMember) {
            this.currentUserRole = currentMember.role;
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
    this.memberToDelete = member;
    this.showDeleteConfirmation = true;
  }

  cancelDeleteMember(): void {
    this.memberToDelete = null;
    this.showDeleteConfirmation = false;
  }

  deleteMember(): void {
    if (!this.memberToDelete || !this.teamId) {
      return;
    }

    this.isDeleting = true;
    const userId = this.memberToDelete.userId;

    this.teamMemberService.removeTeamMember(this.teamId, userId)
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.showDeleteConfirmation = false;
      }))
      .subscribe({
        next: () => {
          this.teamMembers = this.teamMembers.filter(member => member.userId !== userId);
          this.memberToDelete = null;
        },
        error: (err) => {
          this.error = err.message || 'Failed to remove team member. Please try again.';
        }
      });
  }

  updateMemberRole(member: TeamMember, newRole: string): void {
    if (!this.teamId) {
      this.error = 'Team ID is missing';
      return;
    }

    this.isLoading = true;

    this.teamMemberService.updateMemberRole(this.teamId, member.userId, newRole)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedMember: TeamMember) => {
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
}
