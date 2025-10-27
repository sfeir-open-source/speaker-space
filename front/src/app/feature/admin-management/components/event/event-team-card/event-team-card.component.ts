import {Component, inject, Input, input, signal} from '@angular/core';
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
  readonly field = input.required<EventTeamField>();

  private readonly router = inject(Router);
  private readonly userRoleService = inject(UserRoleService);

  async navigateToEvent(eventId: string): Promise<void> {
    if (!eventId) return;

    try {
      const role = this.field().userRole || await this.userRoleService.getUserRoleForEvent(eventId);
      if (role === 'admin') {
        this.router.navigate(['/event-sessions', eventId]);
      } else {
        this.router.navigate(['/speaker/event', eventId]);
      }
    } catch (error) {
      console.error('Error determining user role:', error);
      this.router.navigate(['/speaker/event', eventId]);
    }
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/img/logo-speaker-space.svg';
  }
}
