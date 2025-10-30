import {booleanAttribute, Component, computed, input, Input} from '@angular/core';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FieldComponent} from '../../../../../../shared/input/field.component';
import {IconAlertComponent} from '../../../../../../shared/icon-alert/icon-alert.component';
import {IconName} from '../../../../../../shared/icon-alert/service/icon.service';

@Component({
  selector: 'app-session-datetime-fields',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FieldComponent,
    IconAlertComponent
  ],
  templateUrl: './session-datetime-fields.component.html',
  standalone: true,
  styleUrl: './session-datetime-fields.component.scss'
})
export class SessionDatetimeFieldsComponent {
  form = input.required<FormGroup>();
  eventStartDate = input<Date | undefined>();
  eventEndDate = input<Date | undefined>();
  required = input(true, { transform: booleanAttribute });
  isSubmitted = input<boolean>(false);

  protected readonly IconName = IconName;

  eventDateRange = computed(() => {
    const start = this.eventStartDate();
    const end = this.eventEndDate();

    if (!start || !end) return '';

    const startStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    const endStr = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `${startStr} - ${endStr}`;
  });

  eventStartDateForInput = computed(() => {
    const start = this.eventStartDate();
    return start ? start.toISOString().split('T')[0] : '';
  });

  eventEndDateForInput = computed(() => {
    const end = this.eventEndDate();
    return end ? end.toISOString().split('T')[0] : '';
  });

  hasStartDateError = computed(() => {
    const control = this.form().get('startDate');
    return control && control.invalid && (control.touched || control.dirty || this.isSubmitted());
  });
}
