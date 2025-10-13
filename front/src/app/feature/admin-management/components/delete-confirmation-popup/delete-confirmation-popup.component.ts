import { Component, input, output, computed, signal } from '@angular/core';
import { DeleteConfirmationConfig } from '../../type/components/delete-confirmation';
import { FormsModule } from '@angular/forms';
import {ButtonComponent} from '../../../../shared/button/button.component';

@Component({
  selector: 'app-delete-confirmation-popup',
  imports: [
    FormsModule,
    ButtonComponent
  ],
  templateUrl: './delete-confirmation-popup.component.html',
  styleUrl: './delete-confirmation-popup.component.scss'
})
export class DeleteConfirmationPopupComponent {
  config = input.required<DeleteConfirmationConfig>();
  isOpen = input<boolean>(false);
  isDeleting = input<boolean>(false);

  confirm = output<void>();
  cancel = output<void>();

  userConfirmationText = signal<string>('');

  modalId = computed<string>(() => {
    const currentConfig = this.config();
    return `delete-${currentConfig.entityType}-modal`;
  });

  modalTitleId = computed<string>(() => {
    const currentConfig = this.config();
    return `delete-${currentConfig.entityType}-modal-title`;
  });

  title = computed<string>(() => {
    const currentConfig = this.config();
    return currentConfig.title || `Confirm ${this.capitalizeFirst(currentConfig.entityType)} Deletion`;
  });

  description = computed<string>(() => {
    const currentConfig = this.config();
    return currentConfig.description || this.getDefaultDescription(currentConfig.entityType, currentConfig.entityName);
  });

  confirmButtonText = computed<string>(() => {
    const currentConfig = this.config();
    return currentConfig.confirmButtonText || 'Delete permanently';
  });

  loadingText = computed<string>(() => {
    const currentConfig = this.config();
    return currentConfig.loadingText || 'Deleting...';
  });

  requireTextConfirmation = computed<boolean>(() => {
    const currentConfig = this.config();
    return currentConfig.requireTextConfirmation ?? true;
  });

  requiredConfirmationText = computed<string>(() => {
    const currentConfig = this.config();
    return currentConfig.confirmationText || 'DELETE';
  });

  isConfirmationValid = computed<boolean>(() => {
    if (!this.requireTextConfirmation()) {
      return true;
    }
    return this.userConfirmationText().trim() === this.requiredConfirmationText();
  });

  isDeleteButtonDisabled = computed<boolean>(() =>
    this.isDeleting() || !this.isConfirmationValid()
  );

  descriptionText = computed<string>(() => {
    const currentConfig = this.config();
    return this.getDefaultDescription(currentConfig.entityType, currentConfig.entityName);
  });

  private getDefaultDescription(entityType: string, entityName: string): string {
    if (entityType === 'team') {
      return 'This will permanently delete the team, all events, speakers proposals, reviews, comments, schedule, and settings.';
    } else if (entityType === 'event') {
      return 'This will permanently delete the event, all speakers proposals, reviews, comments, schedule, and settings.';
    }
    return 'This will permanently delete all associated data.';
  }

  private capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

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
    const target = event.target as HTMLElement;
    if (target.id === this.modalId()) {
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
    this.userConfirmationText.set(target.value);
  }

  private resetForm(): void {
    this.userConfirmationText.set('');
  }

  getCancelButtonClass(): string {
    const baseClasses = 'px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none';
    return `${baseClasses} text-lg`;
  }

  readonly deleteButtonFocusClasses = computed<string>(() => {
    return this.isDeleteButtonDisabled()
      ? 'focus:ring-red-300 focus:ring-opacity-50'
      : 'focus:ring-red-500 focus:ring-offset-2 hover:bg-red-700';
  });

  readonly deleteButtonClasses = computed<string>(() => {
    const baseClasses = 'px-4 py-2 bg-red-600 text-white rounded-md flex items-center text-lg transition-colors duration-200 focus:outline-none focus:ring-2';
    const focusClasses = this.deleteButtonFocusClasses();
    const interactionClasses = 'hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600';

    return `${baseClasses} ${focusClasses} ${interactionClasses}`;
  });

}
