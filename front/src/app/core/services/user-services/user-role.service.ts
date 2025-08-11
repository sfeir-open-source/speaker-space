import { Injectable } from '@angular/core';
import { AuthService } from '../../login/services/auth.service';
import { EventService } from '../../../feature/admin-management/services/event/event.service';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import { Event } from '../../../feature/admin-management/type/event/event';
import { UserContextService } from './user-context.service';
import {UserSpeakerService} from './user-speaker.service';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  private roleSubject = new BehaviorSubject<string>('');
  public role$ = this.roleSubject.asObservable();

  constructor(
    private authService: AuthService,
    private eventService: EventService,
    private userSpeakerService: UserSpeakerService
  ) {}

  async getUserRoleForEvent(eventId: string): Promise<'admin' | 'speaker'> {
    try {
      const isSpeaker = await firstValueFrom(
        this.userSpeakerService.isSpeakerForEvent(eventId)
      );

      if (isSpeaker) {
        return 'speaker';
      }

      try {
        await firstValueFrom(this.eventService.getEventById(eventId));
        return 'admin';
      } catch {
        return 'speaker';
      }
    } catch (error) {
      console.warn('Error determining user role, defaulting to speaker:', error);
      return 'speaker';
    }
  }

  getUserRoleFromContext(event: Event): 'admin' | 'speaker' {
    const currentUser = this.authService.getCurrentUserSync();

    if (event.userCreateId && currentUser?.uid === event.userCreateId) {
      return 'admin';
    }

    return 'speaker';
  }

  async hasAnySpeakerRole(): Promise<boolean> {
    try {
      return await firstValueFrom(this.authService.hasAnySpeakerRole());
    } catch {
      return false;
    }
  }

  async getUserSpeakerEvents(): Promise<string[]> {
    try {
      return await firstValueFrom(this.userSpeakerService.getSpeakerEvents());
    } catch {
      return [];
    }
  }

  setRole(role: string): void {
    this.roleSubject.next(role);
  }

  getRole(): Observable<string> {
    return this.role$;
  }
}
