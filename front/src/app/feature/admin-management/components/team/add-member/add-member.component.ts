import {Component, DestroyRef, inject, input, output, signal} from '@angular/core';
import {finalize} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {take} from 'rxjs';
import {TeamMember} from '../../../type/team/team-member';
import {TeamMemberSearchService} from '../../../services/team/team-member-search.service';
import {TeamMemberService} from '../../../services/team/team-member.service';
import {AuthService} from '../../../../../core/login/services/auth.service';
import {AutocompleteComponent} from '../../auto-complete/auto-complete.component';
import {ButtonComponent} from '../../../../../shared/button/button.component';

@Component({
  selector: 'app-add-member',
  imports: [
    AutocompleteComponent,
    ButtonComponent
  ],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss'
})
export class AddMemberComponent {
  readonly teamId = input.required<string>();
  readonly teamName = input.required<string>();
  readonly currentTeamMembers = input.required<TeamMember[]>();
  readonly currentUserRole = input.required<string>();

  readonly memberAdded = output<TeamMember>();
  readonly invitationSent = output<{email: string, teamName: string, teamId: string, inviterName: string}>();
  readonly errorOccurred = output<string>();

  readonly isAddingMember = signal<boolean>(false);

  readonly searchService = inject(TeamMemberSearchService);
  private readonly teamMemberService = inject(TeamMemberService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.searchService.setupSearchListener(() => this.currentTeamMembers())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => this.errorOccurred.emit('Error searching for users')
      });
  }

  onSearchInputChanged(query: string): void {
    if (!query || query.length < 2) {
      this.searchService.selectedUser.set(null);
    }
  }

  addMember(): void {
    if (this.currentUserRole() !== 'Owner') {
      this.errorOccurred.emit('Only Owners can add members');
      return;
    }

    const selectedUser = this.searchService.selectedUser();
    const email = this.searchService.searchControl.value;

    if (selectedUser) {
      this.addExistingUser(selectedUser);
    } else if (email && this.validateEmail(email)) {
      this.inviteByEmail(email);
    } else {
      this.errorOccurred.emit('Please select a user or enter a valid email address');
    }
  }

  private addExistingUser(selectedUser: TeamMember): void {
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
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (addedMember: TeamMember) => {
          this.handleMemberAddedSuccess(addedMember, newMember);
        },
        error: (err: unknown) => {
          const errorMessage = this.extractErrorMessage(err);
          this.errorOccurred.emit(errorMessage);
        }
      });
  }

  private handleMemberAddedSuccess(addedMember: TeamMember, newMember: TeamMember): void {
    this.authService.user$
      .pipe(take(1))
      .subscribe(currentUser => {
        const inviterName = currentUser?.displayName || 'Un membre de l\'équipe';

        this.invitationSent.emit({
          email: newMember.email,
          teamName: this.teamName(),
          teamId: this.teamId(),
          inviterName
        });
      });

    this.memberAdded.emit(addedMember);
    this.searchService.reset();
  }

  private extractErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'string') {
      return err;
    }
    return 'Failed to add team member';
  }

  private inviteByEmail(email: string): void {
    this.isAddingMember.set(true);
    const normalizedEmail = email.toLowerCase();

    this.teamMemberService.inviteMemberByEmail(this.teamId(), normalizedEmail, this.teamName())
      .pipe(
        finalize(() => this.isAddingMember.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (invitedMember) => {
          this.authService.user$.pipe(take(1)).subscribe(currentUser => {
            const inviterName = currentUser?.displayName || 'Un membre de l\'équipe';
            this.invitationSent.emit({
              email: normalizedEmail,
              teamName: this.teamName(),
              teamId: this.teamId(),
              inviterName
            });
            this.memberAdded.emit(invitedMember);
            this.searchService.reset();
          });
        },
        error: () => this.errorOccurred.emit('Failed to invite member')
      });
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}
