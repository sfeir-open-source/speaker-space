import {Component, EventEmitter, Input, Output, OnInit, SimpleChanges, OnChanges} from '@angular/core';
import { FormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import {RolePopupComponent} from './components/role-popup/role-popup.component';
import {DeletePopupComponent} from './components/delete-popup/delete-popup.component';
import {TeamMember} from '../../type/team/team-member';

@Component({
  selector: 'app-members-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RolePopupComponent,
    DeletePopupComponent,
  ],
  templateUrl: './members-card.component.html',
  styleUrl: './members-card.component.scss'
})
export class MembersCardComponent implements OnInit, OnChanges {
  @Input() member!: TeamMember;
  @Input() currentUserRole: string = '';
  @Input() currentUserId: string = '';
  @Input() isCreator: boolean = false;

  @Output() onRemove = new EventEmitter<TeamMember>();
  @Output() onRoleChange = new EventEmitter<{member: TeamMember, newRole: string}>();

  selectedRole: string = '';
  canManageRoles: boolean = false;
  canChangeThisRole: boolean = false;
  canRemoveThisMember: boolean = false;
  showRoleModal: boolean = false;
  showDeleteModal: boolean = false;
  isDeleting: boolean = false;

  ngOnInit() {
    if (this.member) {
      this.selectedRole = this.member.role;
      this.updatePermissions();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentUserId'] || changes['member'] || changes['currentUserRole']) {
      this.updatePermissions();
    }
  }

  updatePermissions() {
    const isCurrentUser: boolean = Boolean(this.currentUserId) && this.member.userId === this.currentUserId;
    this.canManageRoles = this.currentUserRole === 'Owner';
    this.canChangeThisRole = this.canManageRoles && !isCurrentUser;
    this.canRemoveThisMember = this.canManageRoles && this.member.role !== 'Owner';
  }

  openChangeRoleModal() {
    if (this.canChangeThisRole && this.member.userId !== this.currentUserId) {
      this.selectedRole = this.member.role;
      this.showRoleModal = true;
    }
  }

  closeChangeRoleModal() {
    this.showRoleModal = false;
  }

  changeRole(newRole: string) {
    if (newRole !== this.member.role) {
      this.onRoleChange.emit({member: this.member, newRole});
    }
    this.closeChangeRoleModal();
  }

  openDeleteModal() {
    if (this.canRemoveThisMember) {
      this.showDeleteModal = true;
    }
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.isDeleting = false;
  }

  confirmDelete() {
    this.isDeleting = true;
    this.onRemove.emit(this.member);
  }

  getDefaultAvatar(): string {
    return 'img/profil-picture.svg';
  }

  ngAfterViewInit(): void {
  }
}
