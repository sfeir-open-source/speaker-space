import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-auth-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './auth-error-dialog.component.html',
  styleUrl: './auth-error-dialog.component.scss'
})
export class AuthErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AuthErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      email?: string,
      message: string,
      title: string
    }
  ) {}
}
