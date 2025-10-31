import {Component, input} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {VisibilityOption} from '../../../type/event/event-visibility';

@Component({
  selector: 'app-visibility-selector',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './visibility-selector.component.html',
  styleUrl: './visibility-selector.component.scss'
})
export class VisibilitySelectorComponent {
  control = input.required<FormControl<'private' | 'public'>>();

  protected readonly visibilityOptions: VisibilityOption[] = [
    {
      value: 'private',
      label: 'Private',
      description: 'This event would be available to anyone who has the link.'
    },
    {
      value: 'public',
      label: 'Public',
      description: 'This event will be available in the Speaker Space search and visible to anyone.'
    }
  ];
}
