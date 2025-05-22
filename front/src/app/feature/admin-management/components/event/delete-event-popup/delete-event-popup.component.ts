import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-event-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-event-popup.component.html',
  styleUrl: './delete-event-popup.component.scss'
})
export class DeleteEventPopupComponent {
  @Input() eventName: string = '';
  @Input() isOpen: boolean = false;
  @Input() isDeleting: boolean = false;

  @Output() confirm : EventEmitter<void> = new EventEmitter<void>();
  @Output() cancel : EventEmitter<void> = new EventEmitter<void>();

  onCancel(event: MouseEvent): void {
    event.preventDefault();
    this.cancel.emit();
  }

  onConfirm(event: MouseEvent): void {
    event.preventDefault();
    this.confirm.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'delete-event-modal') {
      this.cancel.emit();
    }
  }
}
