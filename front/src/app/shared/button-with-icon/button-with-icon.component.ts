import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-button-with-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-with-icon.component.html',
  styleUrl: './button-with-icon.component.scss'
})
export class ButtonWithIconComponent {
  @Input() route: string = '';
  @Input() materialIcon: string = '';
  @Input() hasNotification: boolean = false;
  @Input() buttonHandler: (() => void) | null = null;
  @Input() notificationCount: number = 1;
  @Input() customClass: string = '';

  @Output() itemClick = new EventEmitter<string>();

  navigate() {
    this.itemClick.emit(this.route);
  }

  handleButtonClick() {
    if (this.buttonHandler) {
      this.buttonHandler();
    } else if (this.route) {
      this.itemClick.emit(this.route);
    }
  }
}
