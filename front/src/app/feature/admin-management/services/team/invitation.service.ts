import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of, switchMap, take, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AuthService} from '../../../../core/login/services/auth.service';
import {environment} from '../../../../../environments/environment.development';
import {TeamMember} from '../../type/team/team-member';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  checkPendingInvitations(): Observable<TeamMember[]> {
    return this.authService.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user || !user.email) {
          return of([]);
        }

        return this.http.get<TeamMember[]>(
          `${environment.apiUrl}/invitations/pending?email=${encodeURIComponent(user.email.toLowerCase())}`,
          { withCredentials: true }
        ).pipe(
          catchError(error => {
            console.error('Error checking pending invitations:', error);
            return of([]);
          })
        );
      })
    );
  }

  acceptInvitation(invitationId: string): Observable<TeamMember> {
    return this.authService.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('User not authenticated'));
        }

        return this.http.post<TeamMember>(
          `${environment.apiUrl}/invitations/${invitationId}/accept`,
          { userId: user.uid },
          { withCredentials: true }
        );
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
