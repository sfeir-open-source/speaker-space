import {Component, Input} from '@angular/core';
import {InputComponent} from '../../../../../../shared/input/input.component';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'app-session-datetime-fields',
  imports: [
    InputComponent
  ],
  templateUrl: './session-datetime-fields.component.html',
  styleUrl: './session-datetime-fields.component.scss'
})
export class SessionDatetimeFieldsComponent {
  @Input() form!: FormGroup;
  @Input() eventStartDate?: Date;
  @Input() eventEndDate?: Date;

  getEventStartDate(): string {
    if (this.eventStartDate) {
      return this.formatDateForInput(this.eventStartDate);
    }
    return '';
  }

  getEventEndDate(): string {
    if (this.eventEndDate) {
      return this.formatDateForInput(this.eventEndDate);
    }
    return '';
  }

  getEventDateRange(): string {
    if (this.eventStartDate && this.eventEndDate) {
      const startStr = this.eventStartDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const endStr = this.eventEndDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return `${startStr} - ${endStr}`;
    }
    return '';
  }

  private formatDateForInput(date: Date): string {
    if (!date || isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }
}
