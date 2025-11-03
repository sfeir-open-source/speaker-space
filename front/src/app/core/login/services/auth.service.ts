import { Injectable, inject } from '@angular/core';
import {
  Auth, onAuthStateChanged, signOut,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { AuthBackendService } from './auth-backend.service';
import { UserStateService } from '../../services/user-services/user-state.service';
import { AuthProvidersService } from './auth-providers.service';
import { EmailLinkHandlerService } from './email-link-handler.service';
import { BehaviorSubject, from, Observable, of, switchMap, take } from 'rxjs';
import { AuthErrorHandlerService } from './auth-error-handler';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly userState = inject(UserStateService);
  private readonly authProviders = inject(AuthProvidersService);
  private readonly authBackend = inject(AuthBackendService);
  private readonly emailLinkHandler = inject(EmailLinkHandlerService);
  private readonly errorHandler = inject(AuthErrorHandlerService);

  private readonly userSubject$ = new BehaviorSubject<FirebaseUser | null>(null);
  readonly user$ = this.userSubject$.asObservable();

  constructor() {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    onAuthStateChanged(this.auth, async (user) => {
      this.userSubject$.next(user);

      if (user) {
        await this.authBackend.syncUserData(user);
      } else {
        this.userState.clearUser();
      }
    });

    this.userState.loadFromStorage();
    this.emailLinkHandler.checkEmailLink();
  }

  async loginWithGoogle(): Promise<FirebaseUser | null> {
    return this.authProviders.loginWithGoogle();
  }

  async loginWithGitHub(): Promise<FirebaseUser | null> {
    return this.authProviders.loginWithGitHub();
  }

  async loginWithEmail(email: string): Promise<boolean | null> {
    return this.emailLinkHandler.sendEmailLink(email);
  }

  async confirmSignIn(email: string, url: string): Promise<FirebaseUser | null> {
    return this.emailLinkHandler.confirmSignIn(email, url);
  }

  isSignInWithEmailLink(url: string): boolean {
    return this.emailLinkHandler.isSignInWithEmailLink(url);
  }

  async processInvitations(user: FirebaseUser): Promise<void> {
    if (!user.email) {
      return;
    }

    return this.authBackend.processInvitations(user.email, user.uid);
  }

  openDialog(component: any, config: any) {
    return this.errorHandler.openDialog(component, config);
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      await this.authBackend.logout();

      this.userState.clearUser();
      this.userSubject$.next(null);

      window.history.replaceState({}, document.title, '/');
      await this.router.navigate(['/']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    return this.authBackend.getIdToken(forceRefresh);
  }

  async getCurrentUserToken(): Promise<string | null> {
    return this.authBackend.getCurrentUserToken();
  }

  getToken(): Observable<string | null> {
    return this.user$.pipe(
      switchMap(user => user ? from(user.getIdToken()) : of(null)),
      catchError(error => {
        console.error('Error getting token:', error);
        return of(null);
      })
    );
  }

  getCurrentUserSync(): { uid: string; email?: string } | null {
    let currentUser: { uid: string; email?: string } | null = null;

    this.user$.pipe(take(1)).subscribe(user => {
      if (user) {
        currentUser = {
          uid: user.uid,
          email: user.email || undefined
        };
      }
    });

    return currentUser;
  }
}
