import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DeleteConfirmationConfig} from '../../type/components/delete-confirmation';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-delete-confirmation-popup',
  imports: [
    FormsModule
  ],
  templateUrl: './delete-confirmation-popup.component.html',
  styleUrl: './delete-confirmation-popup.component.scss'
})
export class DeleteConfirmationPopupComponent implements OnInit {
  @Input() config!: DeleteConfirmationConfig;
  @Input() isOpen: boolean = false;
  @Input() isDeleting: boolean = false;

  @Output() confirm: EventEmitter<void> = new EventEmitter<void>();
  @Output() cancel : EventEmitter<void> = new EventEmitter<void>();

  modalId: string = '';
  modalTitleId: string = '';
  title: string = '';
  description: string = '';
  confirmButtonText: string = '';
  loadingText: string = '';

  userConfirmationText: string = '';
  requiredConfirmationText: string = 'DELETE';
  requireTextConfirmation: boolean = false;

  ngOnInit(): void {
    this.setupModalContent();
  }

  get isConfirmationValid(): boolean {
    if (!this.requireTextConfirmation) {
      return true;
    }
    return this.userConfirmationText.trim() === this.requiredConfirmationText;
  }

  get isDeleteButtonDisabled(): boolean {
    return this.isDeleting || !this.isConfirmationValid;
  }

  private setupModalContent(): void {
    if (!this.config) return;

    const entityType :'team'|'event' = this.config.entityType;
    const entityName: string = this.config.entityName;

    this.modalId = `delete-${entityType}-modal`;
    this.modalTitleId = `delete-${entityType}-modal-title`;

    this.title = this.config.title || `Confirm ${this.capitalizeFirst(entityType)} Deletion`;
    this.description = this.config.description || this.getDefaultDescription(entityType, entityName);
    this.confirmButtonText = this.config.confirmButtonText || 'Delete permanently';
    this.loadingText = this.config.loadingText || 'Deleting...';

    this.requireTextConfirmation = this.config.requireTextConfirmation ?? true;
    this.requiredConfirmationText = this.config.confirmationText || 'DELETE';
  }

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

    if (this.isConfirmationValid && !this.isDeleting) {
      this.confirm.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.id === this.modalId) {
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
    this.userConfirmationText = target.value;
  }

  private resetForm(): void {
    this.userConfirmationText = '';
  }

  getDescriptionText(): string {
    if (this.config.entityType === 'team') {
      return 'This will permanently delete the team, all events, speakers proposals, reviews, comments, schedule, and settings.';
    } else if (this.config.entityType === 'event') {
      return 'This will permanently delete the event, all speakers proposals, reviews, comments, schedule, and settings.';
    }
    return 'This will permanently delete all associated data.';
  }
}
