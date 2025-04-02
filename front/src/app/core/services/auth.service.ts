import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {
  Auth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailLink,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from '@angular/fire/auth';
import {AuthErrorDialogComponent} from '../../shared/auth-error-dialog/auth-error-dialog.component';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment.development';
import {UserDataService} from './user-data.service';

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

  constructor(private userDataService: UserDataService) {
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
      this.user$.next(user);

      if (user) {
        this.fetchAndStoreUserData(user.uid);
      } else {
        this.clearUserData();
      }
    });

    this.restoreUserDataFromStorage();

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
        const mergedUserData = {
          ...userData,
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        };
        await this.saveUserToBackend(result.user);

        if (result.user.displayName) {
          this.userDataService.userName = result.user.displayName;
          localStorage.setItem('userDisplayName', result.user.displayName);
        }

        if (result.user.photoURL) {
          this.userDataService.userPhotoURL = result.user.photoURL;
          localStorage.setItem('userPhotoURL', result.user.photoURL);
        }
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
      console.log('Fetching user data for UID:', uid);
      const userData = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/auth/user/${uid}`, { withCredentials: true })
      );

      console.log('User data received:', userData);

      if (userData) {
        if (userData.displayName) {
          this.userDataService.userName = userData.displayName;
          console.log('Updated userName in UserDataService:', userData.displayName);
        }

        if (userData.email) {
          this.userDataService.userEmail = userData.email;
          console.log('Updated userEmail in UserDataService:', userData.email);
        }

        if (userData.photoURL) {
          this.userDataService.userPhotoURL = userData.photoURL;
          console.log('Updated userPhotoURL in UserDataService:', userData.photoURL);
        }

        localStorage.setItem('userCity', userData.city || '');
        localStorage.setItem('userPhoneNumber', userData.phoneNumber || '');
        localStorage.setItem('userGithubLink', userData.githubLink || '');
        localStorage.setItem('userTwitterLink', userData.twitterLink || '');
        localStorage.setItem('userBlueSkyLink', userData.blueSkyLink || '');
        localStorage.setItem('userLinkedInLink', userData.linkedInLink || '');
        localStorage.setItem('userCompany', userData.company || '');
        localStorage.setItem('userDisplayName', userData.displayName || '');
        localStorage.setItem('userPhotoURL', userData.photoURL || '');

        console.log('User data stored in localStorage');
      }
    } catch (error) {
      console.error('Error fetching user data from Firestore:', error);
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
      console.error('Error sending token to backend:', error);
      throw error;
    }
  }

  private async saveUserToBackend(user: any) {
    if (!user) return;

    try {
      const existingUserData = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/auth/user/${user.uid}`, { withCredentials: true })
      ).catch(() => null);

      interface UserData {
        uid: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
        company?: string | null;
        city?: string | null;
        phoneNumber?: string | null;
        githubLink?: string | null;
        twitterLink?: string | null;
        blueSkyLink?: string | null;
        linkedInLink?: string | null;
      };
      const userData: UserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        company: user.company,
        city: user.city,
        phoneNumber: user.phoneNumber,
        githubLink: user.githubLink,
        twitterLink: user.twitterLink,
        blueSkyLink: user.blueSkyLink,
        linkedInLink: user.linkedInLink,
      };

      const response = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth`, userData, { withCredentials: true })
      );

      return response;
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

    this.clearUserData();

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

  private restoreUserDataFromStorage(): void {
    const company = localStorage.getItem('userCompany');
    const city = localStorage.getItem('userCity');
    const phoneNumber = localStorage.getItem('userPhoneNumber');
    const githubLink = localStorage.getItem('userGithubLink');
    const twitterLink = localStorage.getItem('userTwitterLink');
    const blueSkyLink = localStorage.getItem('userBlueSkyLink');
    const linkedInLink = localStorage.getItem('userLinkedInLink');
    const displayName = localStorage.getItem('userDisplayName');
    const photoURL = localStorage.getItem('userPhotoURL');
    const email = localStorage.getItem('userEmail');

    if (displayName) this.userDataService.userName = displayName;
    if (photoURL) this.userDataService.userPhotoURL = photoURL;
    if (displayName) this.userDataService.userName = displayName;
    if (photoURL) this.userDataService.userPhotoURL = photoURL;
    if (email) this.userDataService.userEmail = email;
    if (company) this.userDataService.userCompany = company;
    if (city) this.userDataService.userCity = city;
    if (phoneNumber) this.userDataService.userPhoneNumber = phoneNumber;
    if (githubLink) this.userDataService.userGithubLink = githubLink;
    if (twitterLink) this.userDataService.userTwitterLink = twitterLink;
    if (blueSkyLink) this.userDataService.userBlueSkyLink = blueSkyLink;
    if (linkedInLink) this.userDataService.userLinkedInLink = linkedInLink;
  }

  private clearUserData(): void {
    this.userDataService.userName = '';
    this.userDataService.userEmail = '';
    this.userDataService.userPhotoURL = '';

    localStorage.removeItem('userDisplayName');
    localStorage.removeItem('userPhotoURL');
  }

  private async fetchUserData(uid: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/auth/user/${uid}`, { withCredentials: true })
      );
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }
}
