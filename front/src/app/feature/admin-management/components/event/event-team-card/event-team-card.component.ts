import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {EventTeamField} from './interface/event-team-field';
import {Router} from '@angular/router';
import {UserRoleService} from '../../../../../core/services/user-services/user-role.service';

@Component({
  selector: 'app-event-team-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-team-card.component.html',
  styleUrl: './event-team-card.component.scss'
})
export class EventTeamCardComponent {
  @Input() field!: EventTeamField;
  @Input() userRole: 'admin' | 'speaker' = 'speaker';

  constructor(
    private router: Router,
    private userRoleService: UserRoleService
  ) {}

  async navigateToEvent(eventId: string): Promise<void> {
    if (!eventId) return;

    try {
      const role = this.field.userRole || await this.userRoleService.getUserRoleForEvent(eventId);
      if (role === 'admin') {
        this.router.navigate(['/event', eventId, 'sessions']);
      } else {
        this.router.navigate(['/speaker/event', eventId, 'sessions']);
      }
    } catch (error) {
      console.error('Error determining user role:', error);
      this.router.navigate(['/speaker/event', eventId, 'sessions']);
    }
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'img/logo-speaker-space.svg';
  }
}
