import {inject, Injectable} from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  GithubAuthProvider,
  signOut,
  User,
  sendSignInLinkToEmail,
  browserLocalPersistence,
  isSignInWithEmailLink,
  signInWithEmailLink,
  setPersistence,
  fetchSignInMethodsForEmail
} from '@angular/fire/auth';
import {BehaviorSubject, firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment.development';
import {Router} from '@angular/router';
import {AuthErrorDialogComponent} from '../../../shared/auth-error-dialog/auth-error-dialog.component';
import {MatDialog} from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  auth = inject(Auth);
  user: User | null = null;
  private http = inject(HttpClient);
  user$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private router = inject(Router);
  dialog = inject(MatDialog);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
      this.user$.next(user);
    });
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
        await this.saveUserToBackend(result.user);
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
    } catch (error: any) {
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
            await this.saveUserToBackend(result.user);
            this.router.navigate(['/']);
          } catch (error) {
            console.error('Error during backend operations after email sign-in:', error);
          }
        }
        return result.user;
      } catch (error) {
        alert("Invalid email or expired Link");
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
                await this.saveUserToBackend(result.user);
              } catch (error) {
              }
            }

            window.history.replaceState({}, document.title, '/');
            this.router.navigate(['/']);
          })
          .catch((error) => {
            console.error('Connection error : ', error);
          });
      } else {
        console.error("No email found in sessionStorage or URL");
      }
    }
  }

  private async sendTokenToBackend(token: string) {
    try {
      const response = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/login`, { idToken: token }, { withCredentials: true })
      );
      return response;
    } catch (error) {
      throw error;
    }
  }


  private async saveUserToBackend(user: any) {
    if (!user) return;
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
    try {
      const response = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth`, userData, { withCredentials: true })
      );
      return response;
    } catch (error) {
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
    window.history.replaceState({}, document.title, '/');
    this.user$.next(null);
    this.router.navigate(['/']);
  }
}
