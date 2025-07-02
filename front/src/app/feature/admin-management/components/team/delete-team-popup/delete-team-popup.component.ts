import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-delete-team-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delete-team-popup.component.html',
  styleUrl: './delete-team-popup.component.scss'
})
export class DeleteTeamPopupComponent {
  @Input() teamName: string = '';
  @Input() isOpen: boolean = false;
  @Input() isDeleting: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  confirmationText: string = '';

  get isConfirmationValid(): boolean {
    return this.confirmationText.trim() === 'DELETE';
  }

  get isDeleteButtonDisabled(): boolean {
    return this.isDeleting || !this.isConfirmationValid;
  }

  onCancel(event: MouseEvent): void {
    event.preventDefault();
    this.resetForm();
    this.cancel.emit();
  }

  onConfirm(event: MouseEvent): void {
    event.preventDefault();

    if (this.isConfirmationValid && !this.isDeleting) {
      this.confirm.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'delete-team-modal') {
      this.resetForm();
      this.cancel.emit();
    }
  }

  private resetForm(): void {
    this.confirmationText = '';
  }

  onConfirmationTextChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.confirmationText = target.value;
  }
}
