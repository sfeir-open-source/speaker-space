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

  navigateToEvent(eventId: string): void {
    if (eventId) {
      console.log('Navigating to event detail:', eventId);
      this.router.navigate(['/event-detail', eventId]);
    } else {
      console.warn('Cannot navigate: Event ID is missing');
    }
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'img/logo-speaker-space.svg';
  }
}
