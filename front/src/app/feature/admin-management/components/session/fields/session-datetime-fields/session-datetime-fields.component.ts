import {booleanAttribute, Component, Input} from '@angular/core';
import {InputComponent} from '../../../../../../shared/input/input.component';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-session-datetime-fields',
  imports: [
    InputComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './session-datetime-fields.component.html',
  styleUrl: './session-datetime-fields.component.scss'
})
export class SessionDatetimeFieldsComponent {
  @Input() form!: FormGroup;
  @Input() eventStartDate?: Date;
  @Input() eventEndDate?: Date;
  @Input({transform: booleanAttribute}) required: boolean = true;

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

  getEventStartDateForInput(): string {
    return this.eventStartDate ? this.eventStartDate.toISOString().split('T')[0] : '';
  }

  getEventEndDateForInput(): string {
    return this.eventEndDate ? this.eventEndDate.toISOString().split('T')[0] : '';
  }
}
