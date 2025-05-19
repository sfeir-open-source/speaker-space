import {Component, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';
import {TeamMember} from '../../../../type/team/team-member';

@Component({
  selector: 'app-delete-popup',
  standalone: true,
  imports: [],
  templateUrl: './delete-popup.component.html',
  styleUrl: './delete-popup.component.scss'
})
export class DeletePopupComponent {
  @Input() member: TeamMember | null = null;
  @Input() isDeleting : boolean = false;
  @Input() isOpen : boolean = false;

  @Output() confirm = new EventEmitter<TeamMember>();
  @Output() cancel = new EventEmitter<void>();

  memberName: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['member'] && this.member) {
      this.memberName = this.member.displayName || this.member.email || 'this member';
    }
  }

  onCancel(event: MouseEvent): void {
    event.preventDefault();
    this.cancel.emit();
  }

  onConfirm(event: MouseEvent): void {
    event.preventDefault();
    if (this.member) {
      this.confirm.emit(this.member);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'delete-modal') {
      this.cancel.emit();
    }
  }
}
