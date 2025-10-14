import { Injectable } from '@angular/core';
import { AuthService } from '../../login/services/auth.service';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import { Event } from '../../../feature/admin-management/type/event/event';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  private roleSubject = new BehaviorSubject<string>('');
  public role$ = this.roleSubject.asObservable();

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  async getUserRoleForEvent(eventId: string): Promise<'admin' | 'speaker'> {
    try {
      const response = await firstValueFrom(
        this.http.get<{event: any, userRole: string, hasAccess: boolean}>(
          `${environment.apiUrl}/event/${eventId}/for-current-user`,
          { withCredentials: true }
        )
      );

      if (!response.hasAccess) {
        throw new Error('No access to this event');
      }

      return response.userRole as 'admin' | 'speaker';
    } catch (error) {
      console.warn('Error determining user role, defaulting to speaker:', error);
      return 'speaker';
    }
  }

  getUserRoleFromContext(event: Event): 'admin' | 'speaker' {
    if (event.userRole) {
      return event.userRole;
    }
    const currentUser = this.authService.getCurrentUserSync();
    if (event.userCreateId && currentUser?.uid === event.userCreateId) {
      return 'admin';
    }

    return 'speaker';
  }

  setRole(role: string): void {
    this.roleSubject.next(role);
  }

  getRole(): Observable<string> {
    return this.role$;
  }
}
