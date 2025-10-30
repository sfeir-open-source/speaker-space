import {Component, computed, inject, input} from '@angular/core';
import {NgClass} from '@angular/common';
import {IconName, IconService} from './service/icon.service';

@Component({
  selector: 'app-icon-alert',
  imports: [
    NgClass
  ],
  templateUrl: './icon-alert.component.html',
  styleUrl: './icon-alert.component.scss'
})
export class IconAlertComponent {
  private readonly iconService = inject(IconService);

  readonly name = input.required<IconName>();
  readonly size = input<number>(16);
  readonly class = input<string>('');

  protected readonly iconData = computed(() =>
    this.iconService.getIcon(this.name())
  );
}
