import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaveStatus } from '../types/save-status.types';

export type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

@Component({
  selector: 'app-save-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './save-indicator.component.html',
  styleUrl: './save-indicator.component.scss'
})
export class SaveIndicatorComponent {
  status = input<SaveStatus>('idle');
  savingMessage = input('Saving changes...');
  savedMessage = input('Changes saved!');
  errorMessage = input('Error saving changes');
  position = input<Position>('bottom-right');

  icon = computed(() => {
    switch (this.status()) {
      case 'saving': return 'autorenew';
      case 'saved': return 'check_circle';
      case 'error': return 'error';
      default: return '';
    }
  });

  message = computed(() => {
    switch (this.status()) {
      case 'saving': return this.savingMessage();
      case 'saved': return this.savedMessage();
      case 'error': return this.errorMessage();
      default: return '';
    }
  });

  containerClasses = computed(() => [
    'save-indicator',
    this.position(),
    this.status() === 'idle' ? 'hidden' : 'visible'
  ]);
}
