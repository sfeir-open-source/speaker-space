import {Component, input, output} from '@angular/core';
import {Speaker} from '../../../type/session/session';

@Component({
  selector: 'app-session-speakers',
  imports: [],
  templateUrl: './session-speakers.component.html',
  standalone: true,
  styleUrl: './session-speakers.component.scss'
})
export class SessionSpeakersComponent {
  readonly speakers = input.required<Speaker[]>();
  readonly speakerClick = output<string>();
  readonly imageError = output<Event>();
}
