import {Component, computed, input, output} from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  standalone: true,
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly route = input<string>('');
  readonly materialIcon = input<string>('');
  readonly buttonHandler = input<(() => void) | null>(null);
  readonly isActivePage = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly hasNotification = input<boolean>(false);
  readonly notificationCount = input<number>(1);
  readonly customClass = input<string>('');
  readonly materialIconClass = input<string>('text-base');
  readonly ariaLabel = input<string | null>(null);
  readonly form = input<string | null>(null);

  readonly itemClick = output<string>();

  readonly buttonClasses = computed(() => {
    const baseClasses = 'rounded-md py-1 px-2 text-sm inline-flex items-center gap-2 transition-colors';
    const customClass = this.customClass();

    const stateClasses = this.isActivePage()
      ? 'bg-grey hover:bg-grey-hover cursor-pointer text-gray-700 shadow-sm'
      : 'cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-indigo-600 whitespace-nowrap';

    const disabledClasses = this.disabled()
      ? 'opacity-50 cursor-not-allowed hover:bg-transparent'
      : '';

    return `${baseClasses} ${customClass} ${stateClasses} ${disabledClasses}`.trim();
  });

  readonly notificationAriaLabel = computed(() => {
    const count = this.notificationCount();
    return count > 1
      ? `You have ${count} notifications`
      : 'You have notifications';
  });

  handleButtonClick(): void {
    if (this.disabled()) {
      return;
    }

    const isFormSubmit = this.type() === 'submit' && this.form();
    if (isFormSubmit) {
      console.log('🔘 Submit button clicked (linked to form)', this.form());
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
