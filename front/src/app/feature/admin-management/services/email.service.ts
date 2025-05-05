import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import {catchError, map} from 'rxjs/operators';

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
  ): Observable<any> {
    const baseUrl = window.location.origin;
    const invitationLink = `${baseUrl}/teams/${teamName}/join?id=${teamId}`;

    return of(null).pipe(
      map(() => {
        console.log('Email invitation prepared for:', recipientEmail);
        return null;
      })
    );
  }
}
