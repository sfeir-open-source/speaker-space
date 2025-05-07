import {Component, EventEmitter, Input, Output, OnInit, AfterViewInit, SimpleChanges} from '@angular/core';
import { FormsModule } from "@angular/forms";
import { ModalService } from './service/modal.service';
import { TeamMember } from '../../type/team-member';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-members-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './members-card.component.html',
  styleUrl: './members-card.component.scss'
})
export class MembersCardComponent implements OnInit, AfterViewInit {
  @Input() member!: TeamMember;
  @Input() currentUserRole: string = '';
  @Input() currentUserId: string = '';
  @Input() isCreator: boolean = false;

  @Output() onRemove = new EventEmitter<void>();
  @Output() onRoleChange = new EventEmitter<string>();

  selectedRole: string = '';
  canManageRoles: boolean = false;
  canChangeThisRole: boolean = false;
  canRemoveThisMember: boolean = false;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    if (this.member) {
      this.selectedRole = this.member.role;
      this.canManageRoles = this.currentUserRole === 'Owner';
      this.updatePermissions();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentUserId'] || changes['member'] || changes['currentUserRole']) {
      this.updatePermissions();
    }
  }

  updatePermissions() {
    const isCurrentUser : boolean = Boolean(this.currentUserId) && this.member.userId === this.currentUserId;

    this.canChangeThisRole = this.canManageRoles && !isCurrentUser;
    this.canRemoveThisMember = this.canManageRoles && this.member.role !== 'Owner';
  }


  ngAfterViewInit() {
    this.initModalListeners();
  }

  initModalListeners() {
    const toggleButtons = document.querySelectorAll('[data-modal-toggle]');
    const targetButtons = document.querySelectorAll('[data-modal-target]');

    toggleButtons.forEach(button => {
      button.addEventListener('click', () => {
        const modalId = button.getAttribute('data-modal-toggle');
        if (modalId) {
          this.modalService.toggleModal(modalId);
        }
      });
    });

    targetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const modalId = button.getAttribute('data-modal-target');
        if (modalId) {
          this.modalService.openModal(modalId);
        }
      });
    });
  }

  openChangeRoleModal() {
    if (!this.canChangeThisRole || this.member.userId === this.currentUserId) {
      return;
    }

    const modalId = `role-modal-${this.member.userId}`;
    this.modalService.openModal(modalId);
  }

  closeChangeRoleModal() {
    const modalId = `role-modal-${this.member.userId}`;
    this.modalService.closeModal(modalId);
  }

  changeRole() {
    if (!this.canChangeThisRole) return;

    this.onRoleChange.emit(this.selectedRole);
    this.closeChangeRoleModal();
  }

  removeMember() {
    if (!this.canRemoveThisMember) return;

    this.onRemove.emit();
  }

  getDefaultAvatar(): string {
    return 'img/profil-picture.svg';
  }
}
