import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-delete-team-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delete-team-popup.component.html',
  styleUrl: './delete-team-popup.component.scss'
})
export class DeleteTeamPopupComponent {
  teamName = input<string>('');
  isOpen = input<boolean>(false);
  isDeleting = input<boolean>(false);

  confirm = output<void>();
  cancel = output<void>();
  confirmationText: string = '';

  isConfirmationValid = computed(() =>
    this.confirmationText.trim() === 'DELETE'
  );

  isDeleteButtonDisabled = computed(() =>
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
