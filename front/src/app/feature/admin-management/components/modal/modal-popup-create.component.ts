import { Component, computed, input, output, signal } from '@angular/core';
import { ButtonComponent } from '../../../../shared/button/button.component';

@Component({
  selector: 'app-modal-popup-create',
  imports: [ButtonComponent],
  templateUrl: './modal-popup-create.component.html',
  standalone: true,
  styleUrl: './modal-popup-create.component.scss'
})
export class ModalPopupCreateComponent {
  title = input.required<string>();
  submitText = input.required<string>();
  submittingText = input.required<string>();
  isSubmitting = input<boolean>(false);
  isFormValid = input<boolean>(false);
  formId = input<string>('session-create-form');

  closed = output<void>();
  submitted = output<void>();

  readonly titleId = signal(`modal-title-${crypto.randomUUID()}`);

  readonly isBlocked = computed(() => this.isSubmitting());

  readonly isSubmitDisabled = computed(() => {
    const blocked = this.isBlocked();
    const formValid = this.isFormValid();

    return blocked || !formValid;
  });

  readonly submitButtonText = computed(() =>
    this.isSubmitting() ? this.submittingText() : this.submitText()
  );

  onClose(): void {
    if (this.isBlocked()) {
      return;
    }
    this.closed.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget && !this.isBlocked()) {
      this.onClose();
    }
  }
}
