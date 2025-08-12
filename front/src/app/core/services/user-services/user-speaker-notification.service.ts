import { Injectable } from '@angular/core';
import {distinctUntilChanged, skip} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {UserStateService} from './user-state.service';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserSpeakerNotificationService {

  constructor(
    private snackBar: MatSnackBar,
    private userState: UserStateService
  ) {
    this.userState.user$.pipe(
      map(user => user?.eventIds?.length || 0),
      distinctUntilChanged(),
      skip(1)
    ).subscribe(eventCount => {
      if (eventCount > 0) {
        this.showSpeakerRoleNotification(eventCount);
      }
    });
  }

  private showSpeakerRoleNotification(eventCount: number): void {
    const message = eventCount === 1
      ? 'Vous avez été identifié comme speaker pour un événement'
      : `Vous avez été identifié comme speaker pour ${eventCount} événements`;

    this.snackBar.open(message, 'Voir mes événements', {
      duration: 8000,
      panelClass: ['speaker-role-snackbar']
    }).onAction().subscribe(() => {
    });
  }
}
