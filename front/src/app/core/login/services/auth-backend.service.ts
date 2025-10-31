import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User as FirebaseUser,
} from '@angular/fire/auth';
import {HttpClient} from '@angular/common/http';
import {UserStateService} from '../../services/user-services/user-state.service';
import {User} from '../../models/user.model';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthBackendService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly userState = inject(UserStateService);

  async processUserLogin(user: FirebaseUser): Promise<void> {
    try {
      const token = await user.getIdToken(true);

      await this.sendTokenToBackend(token);
      await this.processInvitations(user);
      await this.saveUserToBackend(this.createUserPayload(user));
      await this.syncUserData(user);

    } catch (error) {
      console.error('Error during user login process:', error);
      throw error;
    }
  }

  async syncUserData(firebaseUser: FirebaseUser): Promise<void> {
    try {
      const userData = await this.fetchUserData(firebaseUser.uid);

      if (userData) {
        const mergedUser = this.mergeUserData(firebaseUser, userData);
        this.userState.updateUser(mergedUser);
        this.userState.saveToStorage();
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }

  private mergeUserData(firebaseUser: FirebaseUser, userData: User): User {
    return {
      uid: firebaseUser.uid,
      email: userData.email || firebaseUser.email || '',
      name: userData.name || firebaseUser.displayName || '',
      photoURL: userData.photoURL || firebaseUser.photoURL || '',
      company: userData.company || '',
      location: userData.location || '',
      phoneNumber: userData.phoneNumber || '',
      bio: userData.bio || '',
      socialLinks: userData.socialLinks || [],
    };
  }

  private createUserPayload(user: FirebaseUser): Partial<User> {
    return {
      uid: user.uid,
      email: user.email || undefined,
      name: user.displayName || undefined,
      photoURL: user.photoURL || undefined
    };
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    try {
      if (!this.auth.currentUser) {
        return null;
      }

      const token = await this.auth.currentUser.getIdToken(forceRefresh);

      if (forceRefresh) {
        await this.sendTokenToBackend(token);
      }

      return token;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/logout`, {}, {
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Backend logout error:', error);
    }
  }

  private async fetchUserData(uid: string): Promise<User | null> {
    try {
      return await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/auth/user/${uid}`, {
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/login`,
        { idToken: token },
        { withCredentials: true }
      )
    );
  }

  private async saveUserToBackend(user: Partial<User>): Promise<void> {
    if (!user?.uid) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth`, user, {
          withCredentials: true
        })
      );
    } catch (error) {
      console.error('Error saving user to backend:', error);
      throw error;
    }
  }

  async processInvitations(user: FirebaseUser): Promise<void> {
    if (!user?.email) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/public/invitations/process`, {
          email: user.email.toLowerCase(),
          uid: user.uid
        })
      );
    } catch (error) {
      console.error('Error processing invitations:', error);
    }
  }

  async getCurrentUserToken(): Promise<string | null> {
    try {
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        return await currentUser.getIdToken(true);
      }
      return null;
    } catch (error) {
      console.error('Error getting user token:', error);
      return null;
    }
  }
}
