import { Component, computed, input, output } from '@angular/core';
import { TeamMember } from '../../../../../type/team/team-member';
import {ButtonComponent} from '../../../../../../../shared/button/button.component';

@Component({
  selector: 'app-delete-popup',
  standalone: true,
  imports: [
    ButtonComponent
  ],
  templateUrl: './delete-popup.component.html',
  styleUrl: './delete-popup.component.scss'
})
export class DeletePopupComponent {
  member = input<TeamMember | null>(null);
  isDeleting = input<boolean>(false);
  isOpen = input<boolean>(false);

  confirm = output<TeamMember>();
  cancel = output<void>();

  memberName = computed(() => {
    const currentMember = this.member();
    return currentMember?.name || currentMember?.email || 'this member';
  });

  onCancel(event: MouseEvent): void {
    event.preventDefault();
    this.cancel.emit();
  }

  onConfirm(event: MouseEvent): void {
    event.preventDefault();
    const currentMember = this.member();

    if (currentMember) {
      this.confirm.emit(currentMember);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'delete-modal') {
      this.cancel.emit();
    }
  }
}
