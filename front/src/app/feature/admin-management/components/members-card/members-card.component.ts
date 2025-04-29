import { Component, EventEmitter, Input, Output } from '@angular/core';
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
export class MembersCardComponent {
  @Input() member!: TeamMember;
  @Input() currentUserRole: string = '';
  @Input() isCreator: boolean = false;
  @Output() onRemove = new EventEmitter<void>();
  @Output() onRoleChange = new EventEmitter<string>();

  selectedRole: string = '';
  canManageRoles: boolean = false;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    if (this.member) {
      this.selectedRole = this.member.role;
      this.canManageRoles = this.currentUserRole === 'Owner' || this.isCreator;
    }
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
    const modalId = `role-modal-${this.member.userId}`;
    this.modalService.openModal(modalId);
  }

  closeChangeRoleModal() {
    const modalId = `role-modal-${this.member.userId}`;
    this.modalService.closeModal(modalId);
  }

  changeRole() {
    this.onRoleChange.emit(this.selectedRole);
    this.closeChangeRoleModal();
  }

  removeMember() {
    this.onRemove.emit();
  }

  getDefaultAvatar(): string {
    return 'img/profil-picture.svg';
  }
}
