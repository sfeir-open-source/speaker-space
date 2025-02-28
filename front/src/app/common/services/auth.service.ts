import { Injectable } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  GithubAuthProvider,
  signOut,
  User,
  sendSignInLinkToEmail, signInWithEmailAndPassword, isSignInWithEmailLink, signInWithEmailLink
} from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: User | null = null;
  user$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
      this.user$.next(user);
    });
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      console.log("User logged in:", result.user);
      this.user$.next(result.user);
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
      console.log("User logged in:", result.user);
      this.user$.next(result.user);
      return result.user;
    } catch (error) {
      console.error("Login failed", error);
      return null;
    }
  }

  async sendLink(email: string) {
    const actionCodeSettings = {
      url: 'http://localhost:4200/',
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      console.log('link sent to :', email);
      alert('link send ! Check your emails');
    } catch (error) {
      console.error('Link failed', error);
    }
  }

  async confirmSignIn(email: string, url: string) {
    if (isSignInWithEmailLink(this.auth, url)) {
      try {
        const result = await signInWithEmailLink(this.auth, email, url);
        this.user$.next(result.user);
        window.localStorage.removeItem('emailForSignIn');
        console.log("Successful connection");
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

  async logout() {
    await signOut(this.auth);
    console.log('Disconnected');
    this.user$.next(null);
  }
}
