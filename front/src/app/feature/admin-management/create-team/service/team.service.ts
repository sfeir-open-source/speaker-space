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
    console.log('Sending team data:', team);
    return this.http.post<any>(`${environment.apiUrl}/team/create`, team).pipe(
      catchError(error => {
        console.error("Error saving team to backend:", error);
        return throwError(() => ({
          error: error.error || {},
          status: error.status,
          message: error.error?.message || 'An unknown error occurred',
        }));
      })
    );
  }
}
