import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-delete-event-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delete-event-popup.component.html',
  styleUrl: './delete-event-popup.component.scss'
})
export class DeleteEventPopupComponent {
  eventName = input<string>('');
  isOpen = input<boolean>(false);
  isDeleting = input<boolean>(false);

  confirm = output<void>();
  cancel = output<void>();

  confirmationText = signal<string>('');

  isConfirmationValid = computed<boolean>(() =>
    this.confirmationText().trim() === 'DELETE'
  );

  isDeleteButtonDisabled = computed<boolean>(() =>
    this.isDeleting() || !this.isConfirmationValid()
  );

  onCancel(event: MouseEvent): void {
    event.preventDefault();
    this.resetForm();
    this.cancel.emit();
  }

  onConfirm(event: MouseEvent): void {
    event.preventDefault();

    if (this.isConfirmationValid() && !this.isDeleting()) {
      this.confirm.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'delete-event-modal') {
      this.resetForm();
      this.cancel.emit();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.resetForm();
      this.cancel.emit();
    }
  }

  onConfirmationTextChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.confirmationText.set(target.value);
  }

  private resetForm(): void {
    this.confirmationText.set('');
  }
}
