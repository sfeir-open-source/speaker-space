import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {EventTeamField} from './interface/event-team-field';
import {Router} from '@angular/router';

@Component({
  selector: 'app-event-team-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-team-card.component.html',
  styleUrl: './event-team-card.component.scss'
})
export class EventTeamCardComponent {
  @Input() field!: EventTeamField;

  constructor(private router: Router) {}

  navigateToEvent(eventUrl: string): void {
    if (eventUrl) {
      this.router.navigate(['/session', eventUrl]);
    }
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'img/logo-speaker-space.svg';
  }
}
