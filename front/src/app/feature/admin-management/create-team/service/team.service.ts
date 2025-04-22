import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {environment} from '../../../../../environments/environment.development';
import {Team} from '../type/team';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private http = inject(HttpClient);

  constructor() { }

  post$(team: Team): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/team/create`, team).pipe(
      catchError(error => {
        return throwError(() => ({
          error: error.error || {},
          status: error.status,
          message: error.error?.message || 'An unknown error occurred',
        }));
      })
    );
  }

  getUserTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${environment.apiUrl}/team/my-owned-teams`, { withCredentials: true }).pipe(
      catchError(error => {
        return throwError(() => ({
          error: error.error || {},
          status: error.status,
          message: error.error?.message || 'An unknown error occurred',
        }));
      })
    );
  }

  getTeamByUrl(teamUrl: string): Observable<Team> {
    let urlId = teamUrl;
    if (teamUrl.includes('/')) {
      const urlParts = teamUrl.split('/');
      urlId = urlParts[urlParts.length - 1];
    }

    return this.http.get<Team>(`${environment.apiUrl}/team/by-url/${urlId}`, { withCredentials: true }).pipe(
      catchError(error => {
        return throwError(() => ({
          error: error.error || {},
          status: error.status,
          message: error.error?.message || 'An unknown error occurred',
        }));
      })
    );
  }

  updateTeam(teamId: string, team: Partial<Team>): Observable<Team> {
    return this.http.put<Team>(`${environment.apiUrl}/team/${teamId}`, team, { withCredentials: true }).pipe(
      catchError(error => {
        return throwError(() => ({
          error: error.error || {},
          status: error.status,
          message: error.error?.message || 'An unknown error occurred',
        }));
      })
    );
  }
}
