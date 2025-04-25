import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment.development';
import { Team } from '../type/team';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly BASE_URL = 'https://speaker-space.io/team/';
  private teamsSubject = new BehaviorSubject<Team[]>([]);
  public teams$ = this.teamsSubject.asObservable();
  private teamForm: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.teamForm = this.createForm();
    this.loadUserTeams();
  }

  loadUserTeams(): void {
    this.http.get<Team[]>(`${environment.apiUrl}/team/user-teams`, { withCredentials: true })
      .pipe(
        map(teams => teams.map(team => ({
          ...team,
          id: team.id || ''
        }))),
        catchError(this.handleError('Error loading teams'))
      )
      .subscribe(teams => {
        this.teamsSubject.next(teams);
      });
  }

  createTeam(team: Team): Observable<Team> {
    return this.http.post<Team>(`${environment.apiUrl}/team/create`, team, { withCredentials: true })
      .pipe(
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

  getTeamByUrl(teamUrl: string): Observable<Team> {
    const urlId = this.extractUrlId(teamUrl);

    return this.http.get<Team>(`${environment.apiUrl}/team/by-url/${urlId}`, { withCredentials: true })
      .pipe(
        map(team => ({
          ...team,
          id: team.id || ''
        })),
        catchError(this.handleError('Error getting team'))
      );
  }

  updateTeam(teamId: string, team: Partial<Team>): Observable<Team> {
    return this.http.put<Team>(`${environment.apiUrl}/team/${teamId}`, team, { withCredentials: true })
      .pipe(
        tap(updatedTeam => this.updateTeamInList(updatedTeam)),
        catchError(this.handleError('Error updating team'))
      );
  }

  deleteTeam(teamId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/team/${teamId}`, { withCredentials: true })
      .pipe(
        tap(() => this.removeTeamFromList(teamId)),
        catchError(this.handleError('Error deleting team'))
      );
  }

  getForm(): FormGroup {
    return this.teamForm;
  }

  setupNameChangeListener(): void {
    this.teamForm.get('name')?.valueChanges.subscribe(value => {
      if (value) {
        const urlSuffix = this.formatUrlFromName(value);
        this.teamForm.get('url')?.setValue(this.BASE_URL + urlSuffix);
      } else {
        this.teamForm.get('url')?.setValue(this.BASE_URL);
      }
    });
  }

  formatUrlFromName(name: string): string {
    return name.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  extractUrlId(url: string): string {
    return url.includes('/') ? url.split('/').pop() || url : url;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      url: [{value: '', disabled: true}]
    });
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
    return (error: any) => {
      return throwError(() => ({
        error: error.error || {},
        status: error.status,
        message: error.error?.message || 'An unknown error occurred',
      }));
    };
  }
}
