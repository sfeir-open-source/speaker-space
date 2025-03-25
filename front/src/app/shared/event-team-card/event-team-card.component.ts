import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {EventTeamField} from './interface/event-team-field';

@Component({
  selector: 'app-event-team-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-team-card.component.html',
  styleUrl: './event-team-card.component.scss'
})
export class EventTeamCardComponent {
  @Input() title: string = '';
  @Input() type: string = '';
  @Input() img: string = '';
  @Input() link: string = '';
  @Input() isOpen: boolean = false;
  @Input() statusText: string = 'Call for paper';
  @Input() field!: EventTeamField;

}
