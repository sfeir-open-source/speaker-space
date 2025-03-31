import {Component, Input} from '@angular/core';
import {MemberTeamField} from './interface/member-team-field';
import {FormsModule} from "@angular/forms";
import {ButtonGreenActionsComponent} from '../../../../shared/button-green-actions/button-green-actions.component';
import {ModalService} from './service/modal.service';

@Component({
  selector: 'app-members-card',
  standalone: true,
  imports: [
    FormsModule,
    ButtonGreenActionsComponent
  ],
  templateUrl: './members-card.component.html',
  styleUrl: './members-card.component.scss'
})
export class MembersCardComponent {
  @Input() name: string = '';
  @Input() role: string = '';
  @Input() img: string = '';
  @Input() field!: MemberTeamField;

  constructor(private modalService: ModalService) {}

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
    this.modalService.openModal('crud-modal');
  }

  closeChangeRoleModal() {
    this.modalService.closeModal('crud-modal');
  }
}
