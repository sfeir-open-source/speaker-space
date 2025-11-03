import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Auth, User as FirebaseUser } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import {User} from '../../models/user.model';
import {environment} from '../../../../environments/environment.development';
import {UserStateService} from '../../services/user-services/user-state.service';

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
      await this.saveUserToBackend(this.createUserPayload(user));

      if (user.email) {
        await this.processInvitations(user.email, user.uid);
      }

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
      console.error('Error fetching user data (non-blocking):', error);
      return null;
    }
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/login`,
        {idToken: token},
        {withCredentials: true}
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

  async processInvitations(email: string, uid: string): Promise<void> {
    if (!email || !uid) {
      console.warn('Missing email or uid for invitation processing');
      return;
    }

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await firstValueFrom(
          this.http.post<{ success: boolean; message: string }>(
            `${environment.apiUrl}/public/invitations/process`,
            {
              email: email.toLowerCase(),
              uid: uid
            }
          )
        );

        if (response.success) {
          return;
        } else {
          console.warn('Invitation processing returned false:', response.message);
          return;
        }

      } catch (error) {
        attempt++;

        if (attempt >= maxRetries) {
          console.error('Error processing invitations after retries:', error);
          return;
        }

        const delay = 500 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
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
