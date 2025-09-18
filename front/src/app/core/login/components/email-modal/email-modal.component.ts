import { Component, input, output, inject } from '@angular/core';
import { ButtonLoginComponent } from '../button-login/button-login.component';
import { FormsModule } from '@angular/forms';
import { AuthErrorDialogComponent } from '../../../../shared/auth-error-dialog/auth-error-dialog.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-email-modal',
  imports: [
    ButtonLoginComponent,
    FormsModule
  ],
  templateUrl: './email-modal.component.html',
  styleUrl: './email-modal.component.scss'
})
export class EmailModalComponent {
  isOpen = input<boolean>(false);

  closeEvent = output<void>();
  submitEvent = output<string>();
  email: string = '';

  private authService = inject(AuthService);

  mailLinkLogin(email: string): void {
    if (!email) {
      this.authService.openDialog(AuthErrorDialogComponent, {
        width: '400px',
        data: {
          title: 'Error',
          message: 'Please enter a valid email address.'
        }
      });
      return;
    }

    this.authService.loginWithEmail(email);
  }

  onSubmit(): void {
    if (this.email.trim()) {
      this.submitEvent.emit(this.email.trim());
      this.email = '';
    }
  }

  closeModal(): void {
    this.closeEvent.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
