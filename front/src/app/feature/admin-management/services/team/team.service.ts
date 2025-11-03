import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {BehaviorSubject, Observable, shareReplay, throwError} from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {environment} from '../../../../../environments/environment.development';
import {Team} from '../../type/team/team';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly teamsSubject = new BehaviorSubject<Team[]>([]);

  readonly teams$: Observable<Team[]> = this.teamsSubject.asObservable();

  loadUserTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(
      `${environment.apiUrl}/team/user-teams`,
      { withCredentials: true }
    ).pipe(
      map(teams => teams.map(team => ({
        ...team,
        id: team.id || ''
      }))),
      tap(teams => this.teamsSubject.next(teams)),
      catchError(error => {
        console.error('Error loading teams:', error);
        this.teamsSubject.next([]);
        return throwError(() => ({
          error: error.error || {},
          status: error.status,
          message: error.error?.message || 'Failed to load teams',
        }));
      }),
      shareReplay(1)
    );
  }

  createTeam(team: Team): Observable<Team> {
    return this.http.post<Team>(
      `${environment.apiUrl}/team/create`,
      team,
      { withCredentials: true }
    ).pipe(
      map(newTeam => ({
        ...newTeam,
        id: newTeam.id || ''
      })),
      tap(newTeam => {
        const currentTeams = this.teamsSubject.value;
        this.teamsSubject.next([...currentTeams, newTeam]);
      }),
      catchError(this.handleError('Error creating team'))
    );
  }

  getTeamByUrl(teamId: string): Observable<Team> {
    const urlId = this.extractUrlId(teamId);

    return this.http.get<Team>(
      `${environment.apiUrl}/team/by-url/${urlId}`,
      { withCredentials: true }
    ).pipe(
      map(team => ({
        ...team,
        id: team.id || ''
      })),
      catchError(this.handleError('Error getting team'))
    );
  }

  updateTeam(teamId: string, team: Partial<Team>): Observable<Team> {
    return this.http.put<Team>(
      `${environment.apiUrl}/team/${teamId}`,
      team,
      { withCredentials: true }
    ).pipe(
      tap(updatedTeam => this.updateTeamInList(updatedTeam)),
      catchError(error => {
        if (error.status === 403) {
          return throwError(() => ({
            error: error.error || {},
            status: error.status,
            message: 'You do not have permission to update this team. Only Owners can update teams.',
          }));
        }
        return this.handleError('Error updating team')(error);
      })
    );
  }

  deleteTeam(teamId: string): Observable<{ message: string; teamId: string }> {
    return this.http.delete<{ message: string; teamId: string }>(
      `${environment.apiUrl}/team/${teamId}`,
      { withCredentials: true }
    ).pipe(
      tap(() => this.removeTeamFromList(teamId)),
      catchError((error: HttpErrorResponse) => {
        const errorMessages: Record<number, string> = {
          403: 'You don\'t have permission to delete this team',
          404: 'Team not found',
          500: 'Internal server error occurred while deleting team'
        };

        const errorMessage = errorMessages[error.status] || 'Failed to delete team';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getTeamById(id: string): Observable<Team> {
    return this.http.get<Team>(
      `${environment.apiUrl}/team/${id}`,
      { withCredentials: true }
    ).pipe(
      map(team => ({
        ...team,
        id: team.id || ''
      })),
      catchError(error => throwError(() => error))
    );
  }

  private extractUrlId(url: string): string {
    return url.includes('/team/')
      ? url.split('/team/').pop() || url
      : url;
  }

  private updateTeamInList(updatedTeam: Team): void {
    const currentTeams = this.teamsSubject.value;
    const updatedTeams = currentTeams.map(t =>
      t.id === updatedTeam.id ? { ...updatedTeam, id: updatedTeam.id || '' } : t
    );
    this.teamsSubject.next(updatedTeams);
  }

  private removeTeamFromList(teamId: string): void {
    const currentTeams = this.teamsSubject.value;
    const updatedTeams = currentTeams.filter(t => t.id !== teamId);
    this.teamsSubject.next(updatedTeams);
  }

  private handleError(operation: string) {
    return (error: HttpErrorResponse) => {
      console.error(`${operation}:`, error);
      return throwError(() => ({
        error: error.error || {},
        status: error.status,
        message: error.error?.message || 'An unknown error occurred',
      }));
    };
  }
}
