import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, of, switchMap, take, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import { environment } from '../../../../environments/environment.development';
import {TeamMember} from '../type/team-member';
import {AuthService} from '../../../core/login/services/auth.service';
import {EmailService} from './email.service';

@Injectable({
  providedIn: 'root'
})
export class TeamMemberService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private emailService: EmailService
  ) {}

  getTeamMembers(teamId: string): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(
      `${environment.apiUrl}/team-members/${teamId}/members`,
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError('Error loading team members'))
    );
  }

  addTeamMember(teamId: string, member: TeamMember, teamName: string): Observable<TeamMember> {
    return this.http.post<TeamMember>(
      `${environment.apiUrl}/team-members/${teamId}/members`,
      member,
      { withCredentials: true }
    ).pipe(
      switchMap(addedMember => {
        return this.authService.user$.pipe(
          take(1),
          switchMap(currentUser => {
            if (!currentUser) {
              return of(addedMember);
            }

            const inviterName = currentUser?.displayName || 'Un membre de l\'équipe';

            return this.emailService.sendTeamInvitation(
              member.email || '',
              teamName,
              teamId,
              inviterName
            ).pipe(
              catchError(error => {
                console.error('Failed to send invitation email:', error);
                return of(null);
              }),
              map(() => addedMember)
            );
          })
        );
      }),
      catchError(this.handleError('Error adding team member'))
    );
  }

  updateMemberRole(teamId: string, userId: string, role: string): Observable<TeamMember> {
    return this.http.put<TeamMember>(
      `${environment.apiUrl}/team-members/${teamId}/members/${userId}`,
      { role },
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError('Error updating member role'))
    );
  }

  removeTeamMember(teamId: string, userId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/team-members/${teamId}/members/${userId}`,
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError('Error removing team member'))
    );
  }

  searchUsersByEmail(query: string): Observable<TeamMember[]> {
    if (!query || query.length < 2) {
      return of([]);
    }

    return this.http.get<TeamMember[]>(
      `${environment.apiUrl}/team-members/search?email=${encodeURIComponent(query)}`,
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError('Error searching users'))
    );
  }

  private handleError(operation: string) {
    return (error: any) => {
      console.error(`${operation}: ${error.message}`);
      return throwError(() => ({
        error: error.error || {},
        status: error.status,
        message: error.error?.message || 'An unknown error occurred',
      }));
    };
  }
}
