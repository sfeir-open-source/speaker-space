import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EventService } from './event.service';
import { EventDTO } from '../../type/event/eventDTO';
import { DangerZoneConfig } from '../../type/components/danger-zone';
import { DeleteConfirmationConfig } from '../../type/components/delete-confirmation';
import {UserRole} from '../../type/event/event-visibility';

@Injectable()
export class EventDangerActionsService {
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isDeleting = signal<boolean>(false);
  readonly isArchiving = signal<boolean>(false);
  readonly showDeleteConfirmation = signal<boolean>(false);
  readonly showArchiveConfirmation = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly isProcessing = computed(() => this.isDeleting() || this.isArchiving());

  getDangerZoneConfig(
    eventName: string,
    currentUserRole: UserRole
  ): DangerZoneConfig {
    return {
      title: 'Danger zone',
      entityName: eventName,
      entityType: 'event',
      showArchiveSection: true,
      isDeleting: this.isProcessing(),
      currentUserRole
    };
  }

  getDeleteConfirmationConfig(eventName: string): DeleteConfirmationConfig {
    return {
      entityType: 'event',
      entityName: eventName,
      title: 'Confirm Event Deletion',
      confirmButtonText: 'Delete permanently',
      loadingText: 'Deleting...',
      requireTextConfirmation: true,
      confirmationText: 'DELETE'
    };
  }

  confirmArchive(): void {
    this.showArchiveConfirmation.set(true);
  }

  cancelArchive(): void {
    this.showArchiveConfirmation.set(false);
  }

  confirmDelete(): void {
    this.showDeleteConfirmation.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirmation.set(false);
  }

  archiveEvent(eventId: string): void {
    if (!eventId) {
      this.error.set('Event ID is missing - cannot archive event');
      return;
    }

    this.isArchiving.set(true);

    const archiveData: Partial<EventDTO> = {
      idEvent: eventId,
      isFinish: true
    };

    this.eventService.updateEvent(archiveData)
      .pipe(
        finalize(() => {
          this.isArchiving.set(false);
          this.showArchiveConfirmation.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => this.navigateToHome(),
        error: (err) => this.handleArchiveError(err)
      });
  }

  deleteEvent(eventId: string): void {
    if (!eventId) {
      this.error.set('Event ID is missing - cannot delete event');
      return;
    }

    this.isDeleting.set(true);

    this.eventService.deleteEvent(eventId)
      .pipe(
        finalize(() => {
          this.isDeleting.set(false);
          this.showDeleteConfirmation.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => this.navigateToHome(),
        error: (err) => this.handleDeleteError(err)
      });
  }

  private navigateToHome(): void {
    this.router.navigate(['/']);
  }

  private handleArchiveError(err: unknown): void {
    console.error('Error archiving event:', err);
    this.error.set('Failed to archive event. Please try again.');
  }

  private handleDeleteError(err: unknown): void {
    console.error('Error deleting event:', err);
    this.error.set('Failed to delete event. Please try again.');
  }
}
