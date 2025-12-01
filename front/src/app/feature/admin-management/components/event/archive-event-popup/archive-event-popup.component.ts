import { Component, input, output } from '@angular/core';
import {ButtonComponent} from '../../../../../shared/button/button.component';

@Component({
  selector: 'app-archive-event-popup',
  imports: [
    ButtonComponent
  ],
  templateUrl: './archive-event-popup.component.html',
  styleUrl: './archive-event-popup.component.scss'
})
export class ArchiveEventPopupComponent {
  eventName = input<string>('');
  isOpen = input<boolean>(false);
  isArchiving = input<boolean>(false);

  confirm = output<void>();
  cancel = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'archive-event-modal') {
      this.cancel.emit();
    }
  }

  onCancel(event: MouseEvent): void {
    event.preventDefault();
    this.cancel.emit();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cancel.emit();
    }
  }
}
