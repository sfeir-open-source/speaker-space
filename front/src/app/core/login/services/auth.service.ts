import {inject, Injectable} from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  GithubAuthProvider,
  signOut,
  User,
  sendSignInLinkToEmail, browserLocalPersistence, isSignInWithEmailLink, signInWithEmailLink, setPersistence
} from '@angular/fire/auth';
import {BehaviorSubject, firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment.development';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  auth = inject(Auth);
  user: User | null = null;
  private http = inject(HttpClient);
  user$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private router = inject(Router);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
      this.user$.next(user);
    });
    this.checkEmailLink();
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      this.user$.next(result.user);
      if (result.user) {
        await this.saveUserToBackend(result.user);
      }
      this.router.navigate(['/']);
      return result.user;
    } catch (error) {
      console.error("Login failed", error);
      return null;
    }
  }

  async loginWithGitHub(){
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      this.user$.next(result.user);
      if (result.user) {
        await this.saveUserToBackend(result.user);
      }
      this.router.navigate(['/']);
      return result.user;
    } catch (error) {
      console.error("Login failed", error);
      return null;
    }
  }

  async sendLink(email: string) {
    const actionCodeSettings = {
      url: `http://localhost:4200/?email=${encodeURIComponent(email.toLowerCase())}`,
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      sessionStorage.setItem('emailForSignIn', email.toLowerCase());
      console.log('Link sent :', email);
      alert('Link sent ! Check your emails');
    } catch (error) {
      console.error('Sending failed : ', error);
      alert('Sending failed, check your email address');
    }
  }


  async confirmSignIn(email: string, url: string) {
    if (isSignInWithEmailLink(this.auth, url)) {
      try {
        await setPersistence(this.auth, browserLocalPersistence);
        const result = await signInWithEmailLink(this.auth, email, url);
        this.user$.next(result.user);
        window.localStorage.removeItem('emailForSignIn');
        if (result.user) {
          await this.saveUserToBackend(result.user);
        }
        return result.user;
      } catch (error) {
        console.error("Connection failed", error);
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
      let email = localStorage.getItem('emailForSignIn');
      if (!email) {
        const params = new URLSearchParams(window.location.search);
        email = params.get('email');
      }
      if (email) {
        signInWithEmailLink(this.auth, email, window.location.href)
          .then((result) => {
            localStorage.removeItem('emailForSignIn');
            this.user$.next(result.user);
            this.router.navigate(['/']);
            if (result.user) {
              this.saveUserToBackend(result.user);
            }

            window.history.replaceState({}, document.title, '/');
            this.router.navigate(['/']);
          })
          .catch((error) => {
            console.error('Connection error : ', error);
          });
      } else {
        console.error("No email found in localStorage or URL");
      }
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
        this.http.post(`${environment.apiUrl}/users`, userData)
      );
      console.log('User saved to backend:', response);
    } catch (error) {
      console.error('Error saving user to backend:', error);
    }
  }

  async logout() {
    await signOut(this.auth);
    console.log('Disconnected');
    window.history.replaceState({}, document.title, '/');
    this.user$.next(null);
    this.router.navigate(['/']);
  }
}
