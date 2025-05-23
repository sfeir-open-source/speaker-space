import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {TeamMember} from '../../../../../type/team/team-member';

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
  @Input() member!: TeamMember;
  @Input() isOpen: boolean = false;
  @Input() selectedRole: string = '';
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<string>();

  close() {
    this.onClose.emit();
  }

  confirmChange() {
    this.onConfirm.emit(this.selectedRole);
    this.close();
  }
}
