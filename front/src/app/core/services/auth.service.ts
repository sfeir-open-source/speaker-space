import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {
  Auth,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithEmailLink,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  fetchSignInMethodsForEmail,
  setPersistence,
  browserLocalPersistence,
  signOut
} from '@angular/fire/auth';
import { UserStateService } from './user-state.service';
import { User } from '../models/user.model';
import {environment} from '../../../environments/environment.development';
import {AuthErrorDialogComponent} from '../../shared/auth-error-dialog/auth-error-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private http = inject(HttpClient);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private userState = inject(UserStateService);

  user$ = new BehaviorSubject<FirebaseUser | null>(null);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.user$.next(user);

      if (user) {
        this.fetchAndStoreUserData(user.uid);
      } else {
        this.userState.clearUser();
      }
    });

    this.userState.loadFromStorage();

    this.checkEmailLink();
  }

  async loginWithProvider(providerType: 'google' | 'github' | 'email', email?: string) {
    if (providerType === 'email' && email) {
      return this.sendEmailLink(email);
    }

    const provider = providerType === 'google'
      ? new GoogleAuthProvider()
      : new GithubAuthProvider();

    try {
      if (email) {
        try {
          const methods = await fetchSignInMethodsForEmail(this.auth, email);
          if (methods.length > 0 &&
            ((providerType === 'google' && !methods.includes('google.com')) ||
              (providerType === 'github' && !methods.includes('github.com')))) {

            this.showAuthErrorDialog(email);
            return null;
          }
        } catch (error) {
          console.error("Error checking sign-in methods:", error);
        }
      }

      const result = await signInWithPopup(this.auth, provider);
      this.user$.next(result.user);
      if (result.user) {
        const token = await result.user.getIdToken();
        await this.sendTokenToBackend(token);
        const userData = await this.fetchUserData(result.user.uid);
        const mergedUserData: Partial<User> = {
          ...userData,
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        };

        await this.saveUserToBackend(mergedUserData);

        this.userState.updateUser(mergedUserData);
        this.userState.saveToStorage();
      }
      this.router.navigate(['/']);
      return result.user;
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData.email;
        this.showAuthErrorDialog(email);
        return null;
      } else {
        console.error("Login failed", error);
        return null;
      }
    }
  }
  private async fetchAndStoreUserData(uid: string): Promise<void> {
    try {
      const userData = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/auth/user/${uid}`, { withCredentials: true })
      ).catch(() => null);

      if (userData) {
        this.userState.updateUser(userData);
        this.userState.saveToStorage();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  private showAuthErrorDialog(email: string) {
    this.dialog.open(AuthErrorDialogComponent, {
      width: '400px',
      data: {
        title: 'Authentication Error',
        email: email,
        message: `The email address "${email}" is already associated with another sign-in method. Please use the method you initially signed up with.`
      }
    });
  }

  async sendEmailLink(email: string) {
    const actionCodeSettings = {
      url: `${window.location.origin}/?email=${encodeURIComponent(email.toLowerCase())}`,
      handleCodeInApp: true,
    };

    try {
      const methods = await fetchSignInMethodsForEmail(this.auth, email);
      if (methods.length > 0 && !methods.includes('emailLink')) {
        this.showAuthErrorDialog(email);
        return null;
      }

      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      sessionStorage.setItem('emailForSignIn', email.toLowerCase());

      this.dialog.open(AuthErrorDialogComponent, {
        width: '400px',
        data: {
          title: 'Email Sent',
          message: 'A sign-in link has been sent to your email address. Please check your inbox.'
        }
      });

      return true;
    } catch (error) {
      console.error("Error sending email link:", error);

      this.dialog.open(AuthErrorDialogComponent, {
        width: '400px',
        data: {
          title: 'Error',
          message: 'Failed to send sign-in link. Please check your email address and try again.'
        }
      });

      return null;
    }
  }

  async loginWithGoogle() {
    return this.loginWithProvider('google');
  }

  async loginWithGitHub() {
    return this.loginWithProvider('github');
  }

  async loginWithEmail(email: string) {
    return this.loginWithProvider('email', email);
  }

  async confirmSignIn(email: string, url: string) {
    if (isSignInWithEmailLink(this.auth, url)) {
      try {
        await setPersistence(this.auth, browserLocalPersistence);
        const result = await signInWithEmailLink(this.auth, email, url);
        this.user$.next(result.user);
        sessionStorage.removeItem('emailForSignIn');

        if (result.user) {
          const token = await result.user.getIdToken();

          try {
            await this.sendTokenToBackend(token);
            await this.saveUserToBackend({
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL
            });
            this.router.navigate(['/']);
          } catch (error) {
            console.error('Error during backend operations after email sign-in:', error);
          }
        }
        return result.user;
      } catch (error) {
        this.dialog.open(AuthErrorDialogComponent, {
          width: '400px',
          data: {
            title: 'Authentication Error',
            message: 'Invalid email or expired link. Please try again.'
          }
        });
        return null;
      }
    }
    return null;
  }

  isSignInWithEmailLink(url: string) {
    return isSignInWithEmailLink(this.auth, url);
  }

  checkEmailLink() {
    if (isSignInWithEmailLink(this.auth, window.location.href)) {
      let email = sessionStorage.getItem('emailForSignIn');
      if (!email) {
        const params = new URLSearchParams(window.location.search);
        email = params.get('email');
      }
      if (email) {
        signInWithEmailLink(this.auth, email, window.location.href)
          .then(async (result) => {
            sessionStorage.removeItem('emailForSignIn');
            this.user$.next(result.user);

            if (result.user) {
              const token = await result.user.getIdToken();

              try {
                await this.sendTokenToBackend(token);
                await this.saveUserToBackend({
                  uid: result.user.uid,
                  email: result.user.email,
                  displayName: result.user.displayName,
                  photoURL: result.user.photoURL
                });
              } catch (error) {
                console.error('Error during backend operations:', error);
              }
            }

            window.history.replaceState({}, document.title, '/');
            this.router.navigate(['/']);
          })
          .catch((error) => {
            console.error('Connection error:', error);
          });
      } else {
        console.error("No email found in sessionStorage or URL");
      }
    }
  }

  private async sendTokenToBackend(token: string) {
    try {
      return await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/login`, { idToken: token }, { withCredentials: true })
      );
    } catch (error) {
      console.error('Error sending token to backend:', error);
      throw error;
    }
  }

  private async saveUserToBackend(user: Partial<User>) {
    if (!user?.uid) return;

    try {
      return await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth`, user, { withCredentials: true })
      );
    } catch (error) {
      console.error('Error saving user to backend:', error);
      throw error;
    }
  }

  async logout() {
    await signOut(this.auth);
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      );
    } catch (error) {
      console.error('Error during logout:', error);
    }

    this.userState.clearUser();

    window.history.replaceState({}, document.title, '/');
    this.user$.next(null);
    this.router.navigate(['/']);
  }

  async getIdToken(forceRefresh = true): Promise<string | null> {
    try {
      if (!this.auth.currentUser) {
        console.error('No current user found');
        return null;
      }

      const token = await this.auth.currentUser.getIdToken(forceRefresh);
      await this.sendTokenToBackend(token);

      return token;
    } catch (error) {
      console.error('Error getting fresh token:', error);
      return null;
    }
  }

  private async fetchUserData(uid: string): Promise<User | null> {
    try {
      return await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/auth/user/${uid}`, { withCredentials: true })
      );
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  public openDialog(component: any, config: any) {
    return this.dialog.open(component, config);
  }
}
