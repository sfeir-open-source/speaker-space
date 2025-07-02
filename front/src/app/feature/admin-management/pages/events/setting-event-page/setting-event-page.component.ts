import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {finalize, Subject, Subscription, takeUntil} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {SidebarEventComponent} from '../../../components/event/sidebar-event/sidebar-event.component';
import {EventService} from '../../../services/event/event.service';
import {EventDataService} from '../../../services/event/event-data.service';
import {EventDTO} from '../../../type/event/eventDTO';
import {InformationEventComponent} from '../../../components/event/information-event/information-event.component';
import {GeneralInfoEventComponent} from '../../../components/event/general-info-event/general-info-event.component';
import {DangerZoneConfig} from '../../../type/components/danger-zone';
import {DangerZoneComponent} from '../../../components/danger-zone/danger-zone.component';
import {ArchiveEventPopupComponent} from '../../../components/event/archive-event-popup/archive-event-popup.component';
import {DeleteConfirmationConfig} from '../../../type/components/delete-confirmation';
import {
  DeleteConfirmationPopupComponent
} from '../../../components/delete-confirmation-popup/delete-confirmation-popup.component';
import {SessionReviewImportComponent} from '../../../components/session/session-review-import/session-review-import.component';
import {ImportResult} from '../../../type/session/session';
import {
  SessionScheduleImportComponent
} from '../../../components/session/session-schedule-import/session-schedule-import.component';

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
export class SettingEventPageComponent implements OnInit, OnDestroy {
  eventId: string = '';
  eventUrl: string = '';
  eventName: string = '';
  teamUrl: string = '';
  teamId: string = '';
  isLoading: boolean = true;
  error: string | null = null;

  isDeleting: boolean = false;
  isArchiving: boolean = false;
  showDeleteConfirmation: boolean = false;
  showArchiveConfirmation: boolean = false;
  currentUserRole: string = '';

  eventInformationData: Partial<EventDTO> | null = null;
  eventGeneralData: Partial<EventDTO> | null = null;
  visibility: 'private' | 'public' = 'private';

  private destroy$ = new Subject<void>();
  private routeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private eventDataService: EventDataService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.currentUserRole = 'Owner';
    this.subscribeToRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.routeSubscription?.unsubscribe();
  }

  private subscribeToRouteParams(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.eventId = params.get('eventId') || '';

      if (this.eventId) {
        this.loadEventData();
      } else {
        this.error = 'Event ID is missing from route parameters';
        this.isLoading = false;
      }
    });
  }

  loadEventData(): void {
    if (!this.eventId) {
      this.error = 'Event ID is required to load event data';
      this.isLoading = false;
      return;
    }

    this.eventService.getEventById(this.eventId)
      .pipe(
        finalize(() => this.isLoading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (event) => {
          this.handleEventDataLoaded(event);
          this.eventUrl = event.url || '';

          this.eventDataService.loadEvent({
            idEvent: event.idEvent || this.eventId,
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

  private handleEventDataError(err: any): void {
    this.error = 'Failed to load event details. Please try again.';
    console.error('Error loading event data:', err);
  }

  onDangerZoneArchive(): void {
    this.confirmArchiveEvent();
  }

  onDangerZoneDelete(): void {
    this.confirmDeleteEvent();
  }

  confirmArchiveEvent(): void {
    this.showArchiveConfirmation = true;
  }

  cancelArchiveEvent(): void {
    this.showArchiveConfirmation = false;
  }

  confirmDeleteEvent(): void {
    this.showDeleteConfirmation = true;
  }

  cancelDeleteEvent(): void {
    this.showDeleteConfirmation = false;
  }

  deleteEvent(): void {
    if (!this.eventId) {
      this.error = 'Event ID is missing - cannot delete event';
      return;
    }

    this.isDeleting = true;

    this.eventService.deleteEvent(this.eventId)
      .pipe(
        finalize(() => {
          this.isDeleting = false;
          this.showDeleteConfirmation = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Error deleting event:', err);
          this.error = 'Failed to delete event. Please try again.';
        }
      });
  }

  get dangerZoneConfig(): DangerZoneConfig {
    return {
      title: 'Danger zone',
      entityName: this.eventName,
      entityType: 'event',
      showArchiveSection: true,
      isDeleting: this.isDeleting || this.isArchiving,
      currentUserRole: this.currentUserRole
    };
  }

  get deleteConfirmationConfig(): DeleteConfirmationConfig {
    return {
      entityType: 'event',
      entityName: this.eventName,
      title: 'Confirm Event Deletion',
      confirmButtonText: 'Delete permanently',
      loadingText: 'Deleting...',
      requireTextConfirmation: true,
      confirmationText: 'DELETE'
    };
  }

  onDeleteConfirmed(): void {
    this.deleteEvent();
  }

  onDeleteCancelled(): void {
    this.cancelDeleteEvent();
  }

  onImportCompleted(result: ImportResult): void {

    if (result.successCount > 0) {
      this.loadSessions();
    }
  }

  private loadSessions(): void {
  }

  private handleEventDataLoaded(event: any): void {
    this.eventId = event.idEvent || this.eventId;
    this.eventName = event.eventName || '';
    this.eventUrl = event.url || '';
    this.teamUrl = event.teamUrl || '';
    this.teamId = event.teamId || '';
    this.currentUserRole = 'Owner';
    this.visibility = event.isPrivate === true ? 'private' : 'public';

    this.eventGeneralData = {
      idEvent: this.eventId,
      eventName: event.eventName,
      url: event.url,
      conferenceHallUrl: event.conferenceHallUrl,
      timeZone: event.timeZone || 'Europe/Paris',
      isPrivate: event.isPrivate === true,
      type: event.type,
    };

    this.eventInformationData = {
      idEvent: this.eventId,
      startDate: event.startDate,
      endDate: event.endDate,
      isOnline: event.isOnline,
      location: event.location,
      description: event.description,
      webLinkUrl: event.webLinkUrl
    };

    this.error = null;
  }

  archiveEvent(): void {
    if (!this.eventId) {
      this.error = 'Event ID is missing - cannot archive event';
      return;
    }

    this.isArchiving = true;

    const archiveData: Partial<EventDTO> = {
      idEvent: this.eventId,
      isFinish: true
    };

    this.eventService.updateEvent(archiveData)
      .pipe(
        finalize(() => {
          this.isArchiving = false;
          this.showArchiveConfirmation = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Error archiving event:', err);
          this.error = 'Failed to archive event. Please try again.';
        }
      });
  }
}
