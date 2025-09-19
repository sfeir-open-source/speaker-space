import { Component, input, output, effect } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TeamMember } from '../../../../../type/team/team-member';

@Component({
  selector: 'app-role-popup',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './role-popup.component.html',
  styleUrl: './role-popup.component.scss'
})
export class RolePopupComponent {
  member = input.required<TeamMember>();
  isOpen = input<boolean>(false);
  selectedRoleInput = input<string>('', { alias: 'selectedRole' });
  onClose = output<void>();
  onConfirm = output<string>();
  selectedRole: string = '';

  constructor() {
    effect(() => {
      this.selectedRole = this.selectedRoleInput();
    });
  }

  close() {
    this.onClose.emit();
  }

  confirmChange() {
    this.onConfirm.emit(this.selectedRole);
    this.close();
  }
}
