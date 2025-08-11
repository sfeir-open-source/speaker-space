import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router} from '@angular/router';
import { Auth } from '@angular/fire/auth';
import {AuthService} from '../services/auth.service';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | boolean {
    const user = this.auth.currentUser;

    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    if (route.data?.['requiresSpeaker']) {
      return this.checkSpeakerAccess(route);
    }

    return true;
  }

  private checkSpeakerAccess(route: ActivatedRouteSnapshot): Observable<boolean> {
    const eventId = route.params['eventId'];

    if (!eventId) {
      this.router.navigate(['/events']);
      return of(false);
    }

    return this.authService.isUserSpeakerForEvent(eventId).pipe(
      map(isSpeaker => {
        if (!isSpeaker) {
          this.router.navigate(['/events'], {
            queryParams: { error: 'speaker-access-denied' }
          });
        }
        return isSpeaker;
      }),
      catchError(() => {
        this.router.navigate(['/events']);
        return of(false);
      })
    );
  }
}
