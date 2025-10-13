import { Component, input, output, computed } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { RolePopupComponent } from './components/role-popup/role-popup.component';
import { DeletePopupComponent } from './components/delete-popup/delete-popup.component';
import { TeamMember } from '../../../type/team/team-member';
import {ButtonComponent} from '../../../../../shared/button/button.component';

@Component({
  selector: 'app-members-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RolePopupComponent,
    DeletePopupComponent,
    ButtonComponent,
  ],
  templateUrl: './members-card.component.html',
  styleUrl: './members-card.component.scss'
})
export class MembersCardComponent {
  member = input.required<TeamMember>();
  currentUserRole = input<string>('');
  currentUserId = input<string>('');
  isCreator = input<boolean>(false);

  onRemove = output<TeamMember>();
  onRoleChange = output<{member: TeamMember, newRole: string}>();

  selectedRole = computed(() => this.member()?.role ?? '');

  private isCurrentUser = computed(() =>
    Boolean(this.currentUserId()) && this.member()?.userId === this.currentUserId()
  );

  canManageRoles = computed(() =>
    this.currentUserRole() === 'Owner'
  );

  canChangeThisRole = computed(() =>
    this.canManageRoles() && !this.isCurrentUser()
  );

  canRemoveThisMember = computed(() =>
    this.canManageRoles() && this.member()?.role !== 'Owner'
  );

  showRoleModal: boolean = false;
  showDeleteModal: boolean = false;
  isDeleting: boolean = false;

  openChangeRoleModal() {
    if (this.canChangeThisRole() && this.member().userId !== this.currentUserId()) {
      this.showRoleModal = true;
    }
  }

  closeChangeRoleModal() {
    this.showRoleModal = false;
  }

  changeRole(newRole: string) {
    if (newRole !== this.member().role) {
      this.onRoleChange.emit({member: this.member(), newRole});
    }
    this.closeChangeRoleModal();
  }

  openDeleteModal() {
    if (this.canRemoveThisMember()) {
      this.showDeleteModal = true;
    }
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.isDeleting = false;
  }

  confirmDelete() {
    this.isDeleting = true;
    this.onRemove.emit(this.member());
  }

  getDefaultAvatar(): string {
    return 'assets/img/profil-picture.svg';
  }
}
