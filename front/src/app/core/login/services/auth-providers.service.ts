import { Injectable, inject } from '@angular/core';
import { Router} from '@angular/router';
import {
  Auth,
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from '@angular/fire/auth';
import {AuthBackendService} from './auth-backend.service';
import {AuthErrorHandlerService} from './auth-error-handler';

@Injectable({
  providedIn: 'root'
})
export class AuthProvidersService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly authBackend = inject(AuthBackendService);
  private readonly errorHandler = inject(AuthErrorHandlerService);

  async loginWithGoogle() {
    return this.loginWithProvider('google', new GoogleAuthProvider());
  }

  async loginWithGitHub() {
    return this.loginWithProvider('github', new GithubAuthProvider());
  }

  private async loginWithProvider(
    providerType: 'google' | 'github',
    provider: GoogleAuthProvider | GithubAuthProvider
  ): Promise<FirebaseUser | null> {
    try {
      const result = await signInWithPopup(this.auth, provider);

      if (result.user) {
        await this.authBackend.processUserLogin(result.user);
        this.router.navigate(['/']);
      }

      return result.user;
    } catch (error: any) {
      return this.errorHandler.handleProviderError(error);
    }
  }
}
