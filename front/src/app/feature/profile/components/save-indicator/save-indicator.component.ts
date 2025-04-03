import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SaveStatus} from '../../types/save-status.types';

@Component({
  selector: 'app-save-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './save-indicator.component.html',
  styleUrl: './save-indicator.component.scss'
})
export class SaveIndicatorComponent {
  @Input() status: SaveStatus = 'idle';
  @Input() savingMessage: string = 'Saving changes...';
  @Input() savedMessage: string = 'Changes saved!';
  @Input() errorMessage: string = 'Error saving changes';
  @Input() position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = 'bottom-right';

  getIcon(): string {
    switch (this.status) {
      case 'saving': return 'autorenew';
      case 'saved': return 'check_circle';
      case 'error': return 'error';
      default: return '';
    }
  }

  getPositionClasses(): string[] {
    const positionClasses =
      this.position === 'bottom-right' ? 'bottom-4 right-4' :
        this.position === 'bottom-left' ? 'bottom-4 left-4' :
          this.position === 'top-right' ? 'top-4 right-4' :
            'top-4 left-4';

    return [
      positionClasses,
      this.status === 'idle' ? 'opacity-0' : 'opacity-100'
    ];
  }

  getMessage(): string {
    switch (this.status) {
      case 'saving': return this.savingMessage;
      case 'saved': return this.savedMessage;
      case 'error': return this.errorMessage;
      default: return '';
    }
  }
}
