import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from '@angular/fire/auth';
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

  async logout() {
    await signOut(this.auth);
    console.log('Déconnecté');
    this.user$.next(null);
  }
}
