import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-button-green-actions',
  imports: [],
  templateUrl: './button-green-actions.component.html',
  styleUrl: './button-green-actions.component.scss'
})
export class ButtonGreenActionsComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ariaLabel: string | null = null;
  @Input() materialIcon: string = '';
}
