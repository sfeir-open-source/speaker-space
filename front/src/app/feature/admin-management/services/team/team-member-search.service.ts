import { Injectable, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, switchMap, tap } from 'rxjs';
import { TeamMemberService } from './team-member.service';
import { TeamMember } from '../../type/team/team-member';

@Injectable({
  providedIn: 'root'
})
export class TeamMemberSearchService {
  private readonly teamMemberService = inject(TeamMemberService);

  readonly searchControl = new FormControl('');
  readonly searchResults = signal<TeamMember[]>([]);
  readonly isSearching = signal<boolean>(false);
  readonly selectedUser = signal<TeamMember | null>(null);

  setupSearchListener(currentTeamMembers: () => TeamMember[]) {
    return this.searchControl.valueChanges.pipe(
      tap(query => this.handleEmptyQuery(query)),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.performSearch(query, currentTeamMembers))
    );
  }

  private handleEmptyQuery(query: string | null): void {
    if (!query || query.length < 2) {
      this.searchResults.set([]);
      this.isSearching.set(false);
      this.selectedUser.set(null);
    }
  }

  private performSearch(query: string | null, currentTeamMembers: () => TeamMember[]) {
    if (!query || query.length < 2) return [];

    this.isSearching.set(true);
    return this.teamMemberService.searchUsersByEmail(query).pipe(
      finalize(() => this.isSearching.set(false)),
      tap(results => this.filterExistingMembers(results, currentTeamMembers()))
    );
  }

  private filterExistingMembers(results: TeamMember[], currentMembers: TeamMember[]): void {
    const filteredResults = results.filter(user =>
      !currentMembers.some(member => member.userId === user.userId)
    );
    this.searchResults.set(filteredResults);
  }

  selectUser(user: TeamMember): void {
    this.selectedUser.set(user);
    this.searchControl.setValue(user.email);
  }

  reset(): void {
    this.searchControl.setValue('');
    this.selectedUser.set(null);
    this.searchResults.set([]);
  }
}
