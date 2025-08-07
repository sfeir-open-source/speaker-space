import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ButtonGreyComponent} from '../../../../shared/button-grey/button-grey.component';
import {ButtonGreenActionsComponent} from '../../../../shared/button-green-actions/button-green-actions.component';

@Component({
  selector: 'app-modal-popup-create',
  imports: [
    ButtonGreyComponent,
    ButtonGreenActionsComponent
  ],
  templateUrl: './modal-popup-create.component.html',
  styleUrl: './modal-popup-create.component.scss'
})
export class ModalPopupCreateComponent {
  @Input() title!: string;
  @Input() submitText!: string;
  @Input() submittingText!: string;
  @Input() isSubmitting: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  readonly titleId : string = `modal-title-${Math.random().toString(36).substr(2, 9)}`;

  onClose(): void {
    if (this.isSubmitting) return;
    this.closed.emit();
  }

  onSubmit(): void {
    if(this.isSubmitting) return;
    this.submitted.emit();
    this.closed.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget && !this.isSubmitting) {
      this.onClose();
    }
  }
}
