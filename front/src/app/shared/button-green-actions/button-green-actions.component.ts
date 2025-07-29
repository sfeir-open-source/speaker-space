import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-button-green-actions',
  standalone: true,
  imports: [],
  templateUrl: './button-green-actions.component.html',
  styleUrl: './button-green-actions.component.scss'
})
export class ButtonGreenActionsComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ariaLabel: string | null = null;
  @Input() materialIcon: string = '';
  @Input() buttonHandler: (() => void) | null = null;
  @Input() route: string = '';
  @Input() disabled: boolean = false;

  @Output() itemClick = new EventEmitter<string>();

  navigate(): void {
    if (this.disabled) return;
    this.itemClick.emit(this.route);
  }

  handleButtonClick(): void {
    if (this.disabled) return;

    if (this.buttonHandler) {
      this.buttonHandler();
    } else if (this.route) {
      this.itemClick.emit(this.route);
    }
  }
}
