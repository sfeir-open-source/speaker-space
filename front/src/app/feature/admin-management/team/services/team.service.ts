import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {environment} from '../../../../../environments/environment.development';

export interface Team {
  id: string;
  name: string;
  url: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  constructor(private http: HttpClient) {}

  getTeamByUrl(teamUrl: string): Observable<Team> {
    return this.http.get<Team>(`${environment.apiUrl}/team/by-url/${teamUrl}`).pipe(
      catchError(error => {
        throw new Error('Failed to load team details');
      })
    );
  }

  getUserTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${environment.apiUrl}/team/my-owned-teams`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('Error fetching user teams:', error);
        return of([]);
      })
    );
  }
}
