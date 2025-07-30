import { Injectable } from '@angular/core';
import {AuthService} from '../../login/services/auth.service';
import {EventService} from '../../../feature/admin-management/services/event/event.service';
import {firstValueFrom} from 'rxjs';
import {Event} from '../../../feature/admin-management/type/event/event';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {

  constructor(
    private authService: AuthService,
    private eventService: EventService
  ) {}

  async getUserRoleForEvent(eventId: string): Promise<'admin' | 'speaker'> {
    try {
      await firstValueFrom(this.eventService.getEventById(eventId));
      return 'admin';
    } catch (adminError) {
      try {
        const user = await firstValueFrom(this.authService.user$);
        if (user?.email) {
          await firstValueFrom(this.eventService.getSpeakersByEventId(eventId));
          return 'speaker';
        }
        throw new Error('No valid role found');
      } catch (speakerError) {
        return 'speaker';
      }
    }
  }

  getUserRoleFromContext(event: Event): 'admin' | 'speaker' {
    const currentUser = this.authService.getCurrentUserToken();

    if (event.teamId && this.isUserTeamOwner(event.teamId, currentUser)) {
      return 'admin';
    }

    return 'speaker';
  }

  private isUserTeamOwner(teamId: string, user: any): boolean {
    return false;
  }
}
