import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-action-button',
  imports: [],
  templateUrl: './action-button.component.html',
  styleUrl: './action-button.component.scss'
})
export class ActionButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ariaLabel: string | null = null;
}
