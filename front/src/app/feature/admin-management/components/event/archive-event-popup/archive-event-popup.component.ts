import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-archive-event-popup',
  imports: [],
  templateUrl: './archive-event-popup.component.html',
  styleUrl: './archive-event-popup.component.scss'
})
export class ArchiveEventPopupComponent {
  @Input() eventName: string = '';
  @Input() isOpen: boolean = false;
  @Input() isArchiving: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'delete-event-modal') {
      this.cancel.emit();
    }
  }

  onCancel(event: MouseEvent): void {
    event.preventDefault();
    this.cancel.emit();
  }
}
