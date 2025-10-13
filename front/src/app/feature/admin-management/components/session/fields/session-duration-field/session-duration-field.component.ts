import { Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-session-duration-field',
  imports: [],
  templateUrl: './session-duration-field.component.html',
  styleUrl: './session-duration-field.component.scss',
  standalone: true,
  host: {'(document:click)': 'onDocumentClick($event)'}
})
export class SessionDurationFieldComponent {
  selectedDuration = input<number>(60);
  durationChange = output<number>();

  showDropdown = signal<boolean>(false);

  readonly durations = [20, 30, 40, 45, 50, 60, 75, 90, 105, 110, 120, 130].map(val => {
    const hours = Math.floor(val / 60);
    const minutes = val % 60;
    let label = '';

    if (hours > 0) {
      label += `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      if (hours > 0) label += ' ';
      label += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    return { label, value: val };
  });

  currentDurationLabel = computed(() => {
    const duration = this.durations.find(d => d.value === this.selectedDuration());
    return duration ? duration.label : `${this.selectedDuration()} minutes`;
  });

  toggleDropdown(): void {
    this.showDropdown.update(show => !show);
  }

  onDurationSelect(duration: number): void {
    this.durationChange.emit(duration);
    this.showDropdown.set(false);
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const container = target.closest('[data-duration-dropdown]');

    if (!container) {
      this.showDropdown.set(false);
    }
  }
}
