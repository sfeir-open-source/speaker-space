import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  constructor(private http: HttpClient) {}

  sendTeamInvitation(
    recipientEmail: string,
    teamName: string,
    teamId: string,
    inviterName: string
  ): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/emails/team-invitation`,
      {
        recipientEmail,
        teamName,
        teamId,
        inviterName
      },
      { withCredentials: true }
    );
  }
}
