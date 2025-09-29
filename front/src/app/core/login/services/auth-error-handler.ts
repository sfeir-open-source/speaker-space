import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AuthErrorDialogComponent} from '../../../shared/auth-error-dialog/auth-error-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AuthErrorHandlerService {
  private readonly dialog = inject(MatDialog);

  handleProviderError(error: any): null {
    if (error.code === 'auth/account-exists-with-different-credential') {
      this.showAuthErrorDialog(error.customData.email);
    }
    return null;
  }

  showAuthErrorDialog(email: string): void {
    this.dialog.open(AuthErrorDialogComponent, {
      width: '400px',
      data: {
        title: 'Authentication Error',
        email,
        message: `The email address "${email}" is already associated with another sign-in method.`
      }
    });
  }

  showSuccessDialog(title: string, message: string): void {
    this.dialog.open(AuthErrorDialogComponent, {
      width: '400px',
      data: { title, message }
    });
  }

  openDialog(component: any, config: any) {
    return this.dialog.open(component, config);
  }
}
