import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ButtonGreyComponent} from '../../../../shared/button-grey/button-grey.component';
import {ButtonGreenActionsComponent} from '../../../../shared/button-green-actions/button-green-actions.component';

@Component({
  selector: 'app-modal',
  imports: [
    ButtonGreyComponent,
    ButtonGreenActionsComponent
  ],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent {
  @Input() title!: string;
  @Input() submitText!: string;
  @Input() submittingText!: string;
  @Input() isSubmitting: boolean = false;
  @Output() closed = new EventEmitter<void>();

  readonly titleId : string = `modal-title-${Math.random().toString(36).substr(2, 9)}`;

  onClose(): void {
    if (this.isSubmitting) return;
    this.closed.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget && !this.isSubmitting) {
      this.onClose();
    }
  }
}
