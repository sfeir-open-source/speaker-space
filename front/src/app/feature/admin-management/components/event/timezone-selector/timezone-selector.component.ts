import {Component, computed, DestroyRef, inject, input, Signal} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {TimezoneOption} from '../../../type/event/time-zone-option';
import moment from 'moment';
import 'moment-timezone';

@Component({
  selector: 'app-timezone-selector',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './timezone-selector.component.html',
  styleUrl: './timezone-selector.component.scss'
})
export class TimezoneSelectorComponent {
  control = input.required<FormControl<string>>();

  private destroyRef = inject(DestroyRef);

  protected readonly timezoneOptions: Signal<TimezoneOption[]> = computed(() => {
    return moment.tz.names()
      .map(tz => ({
        name: tz,
        offset: moment.tz(tz).utcOffset()
      }))
      .sort((a, b) => a.offset - b.offset);
  });

  protected formatTimezoneOption(tz: TimezoneOption): string {
    const offsetFormatted = moment.tz(tz.name).format('Z');
    return `(GMT${offsetFormatted}) ${tz.name}`;
  }
}
