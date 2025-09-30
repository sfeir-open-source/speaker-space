import { Injectable, inject, signal } from '@angular/core';
import { Observable, switchMap, map, of, throwError, EMPTY } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import {TeamData, TeamUpdateData} from '../../type/team/team-data';
import {TeamService} from './team.service';
import {TeamMemberService} from './team-member.service';
import {AuthService} from '../../../../core/login/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class TeamManagementService {
  private readonly teamService = inject(TeamService);
  private readonly teamMemberService = inject(TeamMemberService);
  private readonly authService = inject(AuthService);

  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  loadTeamData(teamId: string): Observable<TeamData> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.teamService.getTeamByUrl(teamId).pipe(
      map((team: any) => this.transformToTeamData(team, teamId)),
      catchError(err => {
        this.setError('Failed to load team data');
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  updateTeam(teamId: string, updateData: TeamUpdateData): Observable<TeamData> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.teamService.updateTeam(teamId, updateData).pipe(
      map((team: any) => this.transformToTeamData(team, teamId)),
      catchError(err => {
        this.setError('Failed to update team');
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  deleteTeam(teamId: string): Observable<void> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.teamService.deleteTeam(teamId).pipe(
      switchMap((response: any) => {
        console.log('Team deletion response:', response);
        return of(void 0);
      }),
      catchError(err => {
        this.setError('Failed to delete team');
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  getCurrentUserRole(teamId: string): Observable<string> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          console.warn('User not authenticated, returning default role');
          return of('Member');
        }

        return this.teamMemberService.getTeamMembers(teamId).pipe(
          map(members => {
            const currentMember = members.find(m => m.userId === user.uid);
            return currentMember?.role || 'Member';
          }),
          catchError(err => {
            console.error('Error loading team members:', err);
            return of('Member');
          })
        );
      })
    );
  }

  formatUrlFromName(name: string): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    return name.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  setError(message: string): void {
    this.error.set(message);
    console.error('TeamManagementService Error:', message);
  }

  clearError(): void {
    this.error.set(null);
  }

  private transformToTeamData(team: any, fallbackId?: string): TeamData {
    if (!team) {
      throw new Error('Team data is null or undefined');
    }

    return {
      id: this.ensureString(team.id || fallbackId),
      name: this.ensureString(team.name),
      url: this.ensureString(team.url || team.id || fallbackId)
    };
  }

  private ensureString(value: any): string {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return '';
  }
}
