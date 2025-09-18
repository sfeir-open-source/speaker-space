import { Component, output, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button-grey',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-grey.component.html',
  styleUrl: './button-grey.component.scss'
})
export class ButtonGreyComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly route = input<string>('');
  readonly materialIcon = input<string>('');
  readonly buttonHandler = input<(() => void) | null>(null);
  readonly isActivePage = input<boolean>(false);
  readonly customTextClass = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly ariaLabel = input<string | null>(null);

  readonly itemClick = output<string>();

  readonly buttonClasses = computed(() => {
    const baseClasses = 'rounded-md py-1 px-2 text-sm inline-flex items-center gap-2 transition-colors';
    const customClass = this.customTextClass();

    const stateClasses = this.isActivePage()
      ? 'bg-grey hover:bg-grey-hover cursor-pointer text-gray-700 shadow-sm'
      : 'cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-indigo-600 whitespace-nowrap';

    const disabledClasses = this.disabled()
      ? 'opacity-50 cursor-not-allowed hover:bg-transparent'
      : '';

    return `${baseClasses} ${customClass} ${stateClasses} ${disabledClasses}`.trim();
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
