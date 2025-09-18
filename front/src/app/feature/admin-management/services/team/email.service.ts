import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment.development';

interface EmailInvitationRequest {
  recipientEmail: string;
  teamName: string;
  teamId: string;
  inviterName: string;
  invitationLink: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

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
  ): Observable<EmailResponse> {
    const baseUrl: string = window.location.origin;
    const invitationLink = `${baseUrl}/teams/${teamName}/join?id=${teamId}`;

    const emailRequest: EmailInvitationRequest = {
      recipientEmail,
      teamName,
      teamId,
      inviterName,
      invitationLink
    };

    return this.http.post<EmailResponse>(
      `${environment.apiUrl}/emails/team-invitation`,
      emailRequest,
      { withCredentials: true }
    ).pipe(
      catchError(error => {
        console.error('Email service error:', error);
        throw error;
      })
    );
  }
}
