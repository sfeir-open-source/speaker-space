import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-button-grey',
  imports: [CommonModule],
  templateUrl: './button-grey.component.html',
  styleUrl: './button-grey.component.scss'
})
export class ButtonGreyComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() route: string = '';
  @Input() materialIcon: string = '';
  @Input() buttonHandler: (() => void) | null = null;
  @Input() isActivePage: boolean = false;
  @Input() customTextClass: string = '';

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
