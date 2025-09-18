import { Component, output, input } from '@angular/core';

@Component({
  selector: 'app-button-green-actions',
  standalone: true,
  imports: [],
  templateUrl: './button-green-actions.component.html',
  styleUrl: './button-green-actions.component.scss'
})
export class ButtonGreenActionsComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly ariaLabel = input<string | null>(null);
  readonly materialIcon = input<string>('');
  readonly buttonHandler = input<(() => void) | null>(null);
  readonly route = input<string>('');
  readonly disabled = input<boolean>(false);

  readonly itemClick = output<string>();


  handleButtonClick(): void {
    if (this.disabled()) {
      return;
    }

    const handler = this.buttonHandler();
    const routeValue = this.route();

    if (handler) {
      handler();
    } else if (routeValue) {
      this.itemClick.emit(routeValue);
    }
  }
}
