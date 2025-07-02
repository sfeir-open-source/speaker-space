import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-delete-event-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delete-event-popup.component.html',
  styleUrl: './delete-event-popup.component.scss'
})
export class DeleteEventPopupComponent {
  @Input() eventName: string = '';
  @Input() isOpen: boolean = false;
  @Input() isDeleting: boolean = false;

  @Output() confirm: EventEmitter<void> = new EventEmitter<void>();
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();

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
    if ((event.target as HTMLElement).id === 'delete-event-modal') {
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
