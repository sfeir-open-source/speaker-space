import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-team-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-team-popup.component.html',
  styleUrl: './delete-team-popup.component.scss'
})
export class DeleteTeamPopupComponent {
  @Input() teamName: string = '';
  @Input() isOpen: boolean = false;
  @Input() isDeleting: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onCancel(event: MouseEvent): void {
    event.preventDefault();
    this.cancel.emit();
  }

  onConfirm(event: MouseEvent): void {
    event.preventDefault();
    this.confirm.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'delete-team-modal') {
      this.cancel.emit();
    }
  }
}
