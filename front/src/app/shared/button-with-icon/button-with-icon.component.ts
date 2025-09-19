import { Component, output, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button-with-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-with-icon.component.html',
  styleUrl: './button-with-icon.component.scss'
})
export class ButtonWithIconComponent {
  readonly route = input<string>('');
  readonly materialIcon = input<string>('');
  readonly hasNotification = input<boolean>(false);
  readonly buttonHandler = input<(() => void) | null>(null);
  readonly notificationCount = input<number>(1);
  readonly disabled = input<boolean>(false);
  readonly customClass = input<string>('');
  readonly ariaLabel = input<string | null>(null);

  readonly itemClick = output<string>();

  readonly buttonClasses = computed(() => {
    const baseClasses = 'group flex items-center gap-x-3 w-full text-left rounded-md p-2 leading-6 transition-colors';
    const customClass = this.customClass();

    const stateClasses = this.disabled()
      ? 'opacity-50 cursor-not-allowed hover:bg-transparent'
      : 'hover:bg-gray-100 cursor-pointer';

    return `${baseClasses} ${customClass} ${stateClasses}`.trim();
  });

  readonly notificationAriaLabel = computed(() => {
    const count = this.notificationCount();
    return count > 1
      ? `You have ${count} notifications`
      : 'You have notifications';
  });

  navigate(): void {
    if (this.disabled()) {
      return;
    }

    const routeValue = this.route();
    if (routeValue) {
      this.itemClick.emit(routeValue);
    }
  }

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
