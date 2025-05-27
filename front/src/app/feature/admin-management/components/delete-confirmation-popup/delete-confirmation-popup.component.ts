import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DeleteConfirmationConfig} from '../../type/components/delete-confirmation';

@Component({
  selector: 'app-delete-confirmation-popup',
  imports: [],
  templateUrl: './delete-confirmation-popup.component.html',
  styleUrl: './delete-confirmation-popup.component.scss'
})
export class DeleteConfirmationPopupComponent implements OnInit {
  @Input() config!: DeleteConfirmationConfig;
  @Input() isOpen: boolean = false;
  @Input() isDeleting: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  modalId: string = '';
  modalTitleId: string = '';
  title: string = '';
  description: string = '';
  confirmButtonText: string = '';
  loadingText: string = '';

  ngOnInit(): void {
    this.setupModalContent();
  }

  private setupModalContent(): void {
    if (!this.config) return;

    const entityType = this.config.entityType;
    const entityName = this.config.entityName;

    this.modalId = `delete-${entityType}-modal`;
    this.modalTitleId = `delete-${entityType}-modal-title`;

    this.title = this.config.title || `Confirm ${this.capitalizeFirst(entityType)} Deletion`;

    this.description = this.config.description || this.getDefaultDescription(entityType, entityName);

    this.confirmButtonText = this.config.confirmButtonText || 'Delete permanently';

    this.loadingText = this.config.loadingText || 'Deleting...';
  }

  private getDefaultDescription(entityType: string, entityName: string): string {
    const baseText = `Are you sure you want to delete the ${entityType} "${entityName}"?`;

    if (entityType === 'team') {
      return `${baseText} This will permanently delete the team, all events, speakers proposals, reviews, comments, schedule, and settings. This action cannot be undone.`;
    } else if (entityType === 'event') {
      return `${baseText} This will permanently delete the event, all speakers proposals, reviews, comments, schedule, and settings. This action cannot be undone.`;
    }

    return `${baseText} This action cannot be undone.`;
  }

  private capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  onCancel(event: MouseEvent): void {
    event.preventDefault();
    this.cancel.emit();
  }

  onConfirm(event: MouseEvent): void {
    event.preventDefault();
    this.confirm.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.id === this.modalId) {
      this.cancel.emit();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cancel.emit();
    }
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
