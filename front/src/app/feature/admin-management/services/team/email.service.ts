import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, of } from 'rxjs';
import {map} from 'rxjs/operators';

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
    const baseUrl : string = window.location.origin;
    const invitationLink = `${baseUrl}/teams/${teamName}/join?id=${teamId}`;

    return of(null).pipe(
      map(() => {
        return null;
      })
    );
  }
}
