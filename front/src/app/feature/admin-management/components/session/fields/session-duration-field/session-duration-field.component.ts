import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-session-duration-field',
  imports: [],
  templateUrl: './session-duration-field.component.html',
  styleUrl: './session-duration-field.component.scss',
  host: { '(document:click)': 'onDocumentClick($event)' }
  })
export class SessionDurationFieldComponent {
  @Input() selectedDuration: number = 60;
  @Output() durationChange = new EventEmitter<number>();

  showDropdown: boolean = false;

  readonly durations = [20, 30, 40, 45, 50, 60, 75, 90, 105, 110, 120, 130].map(val => {
    const hours : number = Math.floor(val / 60);
    const minutes : number = val % 60;
    let label : string = '';
    if (hours > 0) {
      label += `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      if (hours > 0) label += ' ';
      label += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return { label, value: val };
  });

  getDurationLabel(minutes: number): string {
    const duration = this.durations.find(d => d.value === minutes);
    return duration ? duration.label : `${minutes} minutes`;
  }

  onDurationSelect(duration: number): void {
    this.selectedDuration = duration;
    this.durationChange.emit(duration);
    this.showDropdown = false;
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const container = target.closest('[data-duration-dropdown]');
    if (!container && this.showDropdown) {
      this.showDropdown = false;
    }
  }
}
