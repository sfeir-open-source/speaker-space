import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavbarEventPageComponent } from '../../../components/event/navbar-event-page/navbar-event-page.component';
import { SidebarEventComponent } from '../../../components/event/sidebar-event/sidebar-event.component';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import { EventDTO } from '../../../type/event/eventDTO';
import { InformationEventComponent } from '../../../components/event/information-event/information-event.component';
import { GeneralInfoEventComponent } from '../../../components/event/general-info-event/general-info-event.component';
import { DangerZoneConfig } from '../../../type/components/danger-zone';
import { DangerZoneComponent } from '../../../components/danger-zone/danger-zone.component';
import { ArchiveEventPopupComponent } from '../../../components/event/archive-event-popup/archive-event-popup.component';
import { DeleteConfirmationConfig } from '../../../type/components/delete-confirmation';
import { DeleteConfirmationPopupComponent } from '../../../components/delete-confirmation-popup/delete-confirmation-popup.component';
import { SessionReviewImportComponent } from '../../../components/session/session-review-import/session-review-import.component';
import { ImportResult } from '../../../type/session/session';
import { SessionScheduleImportComponent } from '../../../components/session/session-schedule-import/session-schedule-import.component';

type UserRole = 'Owner' | 'Admin' | 'Member';
type EventVisibility = 'private' | 'public';

@Component({
  selector: 'app-setting-event-page',
  standalone: true,
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    ReactiveFormsModule,
    InformationEventComponent,
    SidebarEventComponent,
    GeneralInfoEventComponent,
    DangerZoneComponent,
    ArchiveEventPopupComponent,
    DeleteConfirmationPopupComponent,
    SessionReviewImportComponent,
    SessionScheduleImportComponent,
  ],
  templateUrl: './setting-event-page.component.html',
  styleUrl: './setting-event-page.component.scss'
})
export class SettingEventPageComponent implements OnInit {
  readonly eventId = signal<string>('');
  readonly eventUrl = signal<string>('');
  readonly eventName = signal<string>('');
  readonly teamUrl = signal<string>('');
  readonly teamId = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly isDeleting = signal<boolean>(false);
  readonly isArchiving = signal<boolean>(false);
  readonly showDeleteConfirmation = signal<boolean>(false);
  readonly showArchiveConfirmation = signal<boolean>(false);
  readonly currentUserRole = signal<UserRole>('Owner');

  readonly eventInformationData = signal<Partial<EventDTO> | null>(null);
  readonly eventGeneralData = signal<Partial<EventDTO> | null>(null);
  readonly visibility = signal<EventVisibility>('private');

  readonly isProcessing = computed(() => this.isDeleting() || this.isArchiving());
  readonly canShowDangerZone = computed(() => this.currentUserRole() === 'Owner');
  readonly hasEventData = computed(() => !!this.eventGeneralData() && !!this.eventInformationData());

  readonly dangerZoneConfig = computed<DangerZoneConfig>(() => ({
    title: 'Danger zone',
    entityName: this.eventName(),
    entityType: 'event',
    showArchiveSection: true,
    isDeleting: this.isProcessing(),
    currentUserRole: this.currentUserRole()
  }));

  readonly deleteConfirmationConfig = computed<DeleteConfirmationConfig>(() => ({
    entityType: 'event',
    entityName: this.eventName(),
    title: 'Confirm Event Deletion',
    confirmButtonText: 'Delete permanently',
    loadingText: 'Deleting...',
    requireTextConfirmation: true,
    confirmationText: 'DELETE'
  }));

  private routeSubscription?: Subscription;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventService: EventService,
    private readonly eventDataService: EventDataService,
  ) {}

  ngOnInit(): void {
    this.isLoading.set(true);
    this.currentUserRole.set('Owner');
    this.subscribeToRouteParams();
  }

  private subscribeToRouteParams(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const eventIdParam = params.get('eventId') || '';
      this.eventId.set(eventIdParam);

      if (eventIdParam) {
        this.loadEventData();
      } else {
        this.error.set('Event ID is missing from route parameters');
        this.isLoading.set(false);
      }
    });
  }

  loadEventData(): void {
    const eventId = this.eventId();
    if (!eventId) {
      this.error.set('Event ID is required to load event data');
      this.isLoading.set(false);
      return;
    }

    this.eventService.getEventById(eventId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (event) => {
          this.handleEventDataLoaded(event);
          this.eventUrl.set(event.url || '');

          this.eventDataService.loadEvent({
            idEvent: event.idEvent || eventId,
            eventName: event.eventName || '',
            teamId: event.teamId || '',
            url: event.url || '',
            teamUrl: event.teamUrl,
            webLinkUrl: event.webLinkUrl,
            type: event.type,
          });
        },
        error: (err) => {
          this.handleEventDataError(err);
        }
      });
  }

  private handleEventDataLoaded(event: any): void {
    this.eventId.set(event.idEvent || this.eventId());
    this.eventName.set(event.eventName || '');
    this.eventUrl.set(event.url || '');
    this.teamUrl.set(event.teamUrl || '');
    this.teamId.set(event.teamId || '');
    this.currentUserRole.set('Owner');
    this.visibility.set(event.isPrivate === true ? 'private' : 'public');

    this.eventGeneralData.set({
      idEvent: this.eventId(),
      eventName: event.eventName,
      url: event.url,
      conferenceHallUrl: event.conferenceHallUrl,
      timeZone: event.timeZone || 'Europe/Paris',
      isPrivate: event.isPrivate === true,
      type: event.type,
    });

    this.eventInformationData.set({
      idEvent: this.eventId(),
      startDate: event.startDate,
      endDate: event.endDate,
      isOnline: event.isOnline,
      location: event.location,
      description: event.description,
      webLinkUrl: event.webLinkUrl
    });

    this.error.set(null);
  }

  private handleEventDataError(err: any): void {
    this.error.set('Failed to load event details. Please try again.');
    console.error('Error loading event data:', err);
  }

  onDangerZoneArchive(): void {
    this.confirmArchiveEvent();
  }

  onDangerZoneDelete(): void {
    this.confirmDeleteEvent();
  }

  confirmArchiveEvent(): void {
    this.showArchiveConfirmation.set(true);
  }

  cancelArchiveEvent(): void {
    this.showArchiveConfirmation.set(false);
  }

  confirmDeleteEvent(): void {
    this.showDeleteConfirmation.set(true);
  }

  cancelDeleteEvent(): void {
    this.showDeleteConfirmation.set(false);
  }

  archiveEvent(): void {
    const eventId = this.eventId();
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.navigateToHome();
        },
        error: (err) => {
          this.handleArchiveError(err);
        }
      });
  }

  deleteEvent(): void {
    const eventId = this.eventId();
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.navigateToHome();
        },
        error: (err) => {
          this.handleDeleteError(err);
        }
      });
  }

  onDeleteConfirmed(): void {
    this.deleteEvent();
  }

  onDeleteCancelled(): void {
    this.cancelDeleteEvent();
  }

  private navigateToHome(): void {
    this.router.navigate(['/']);
  }

  private handleArchiveError(err: any): void {
    console.error('Error archiving event:', err);
    this.error.set('Failed to archive event. Please try again.');
  }

  private handleDeleteError(err: any): void {
    console.error('Error deleting event:', err);
    this.error.set('Failed to delete event. Please try again.');
  }
}
