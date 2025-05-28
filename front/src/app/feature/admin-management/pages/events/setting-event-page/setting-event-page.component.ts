import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {finalize, Subscription} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import moment from 'moment';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {SidebarEventComponent} from '../../../components/event/sidebar-event/sidebar-event.component';
import {FormField} from '../../../../../shared/input/interface/form-field';
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
  ],
  templateUrl: './setting-event-page.component.html',
  styleUrl: './setting-event-page.component.scss'
})
export class SettingEventPageComponent implements OnInit, OnDestroy {
  activeSection: string = 'settings-general';
  eventId: string = '';
  eventUrl: string = '';
  eventName: string = '';
  teamUrl: string = '';
  teamId: string = '';
  isLoading: boolean = true;
  error: string | null = null;
  isDeleting: boolean = false;
  showDeleteConfirmation: boolean = false;
  currentUserRole: string = '';
  dateTimeUtc = moment.utc();
  dateTimeLocal: moment.Moment | null = null;
  visibility: 'private' | 'public' = 'private';
  timezoneSelector = new FormControl('Europe/Paris');
  eventForm: FormGroup;
  private nameChangeSubscription?: Subscription;
  private routeSubscription?: Subscription;
  eventInformationData: Partial<EventDTO> | null = null;
  eventGeneralData: Partial<EventDTO> | null = null
  showArchiveConfirmation: boolean = false;
  isArchiving: boolean = false;
  readonly BASE_URL = 'https://speaker-space.io/event/';

  formFields: FormField[] = [
    {
      name: 'eventName',
      label: 'Name',
      placeholder: '',
      type: 'text',
      required: true,
    },
    {
      name: 'eventURL',
      label: 'Event URL',
      placeholder: '',
      type: 'text',
      required: false,
      disabled: true,
    },
    {
      name: 'urlConferenceHall',
      label: 'Conference Hall Url Connexion',
      paragraph: 'Use a conference hall existing URL if you want to synchronize conference Hall Datas',
      type: 'text',
      required: false,
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private eventDataService: EventDataService,
    private fb: FormBuilder,
  ) {
    this.eventForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.activeSection = 'settings-general';
    this.isLoading = true;
    this.checkForEmailModal();
    this.currentUserRole = 'Owner';

    this.subscribeToRouteParams();
    this.timezoneSelector.valueChanges.subscribe(timezone => {
      this.updateLocalTime(timezone || 'Europe/Paris');
      this.eventForm.get('timeZone')?.setValue(timezone);
    });

    this.updateLocalTime(this.timezoneSelector.value || 'Europe/Paris');
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      eventName: [{value: '', disabled: false}, Validators.required],
      eventURL: {value: '', disabled: true}
    });
  }

  private checkForEmailModal(): void {
    const params = new URLSearchParams(window.location.search);
    const showEmailModal = params.get('showEmailModal');

    if (showEmailModal === 'true') {
      const modal = document.getElementById('crud-modal');
      if (modal) {
        modal.classList.remove('hidden');
      }
    }
  }

  private handleEventDataError(err: any): void {
    this.error = 'Failed to load event details. Please try again.';
    this.isLoading = false;
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      return;
    }

    if (!this.eventId) {
      this.error = 'Event ID is missing - cannot update event';
      return;
    }

    const formValues = this.eventForm.getRawValue();
    const updatedEvent = {
      idEvent: this.eventId,
      eventName: formValues.eventName,
      timeZone: formValues.timeZone,
      url: formValues.eventURL.replace(this.BASE_URL, '')
    };

    this.isLoading = true;

    this.eventService.updateEvent(updatedEvent)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.handleEventUpdated(response);
        },
        error: (err) => {
          this.handleEventUpdateError(err);
        }
      });
  }

  private handleEventUpdated(event: any): void {
    this.eventName = event.eventName || event.name;
    this.eventUrl = event.url || '';
  }

  private handleEventUpdateError(err: any): void {
    this.error = 'Failed to update event. Please try again.';
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
        })
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

  private unsubscribeAll(): void {
    if (this.nameChangeSubscription) {
      this.nameChangeSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  loadEventData(): void {
    if (!this.eventId) {
      this.error = 'Event ID is required to load event data';
      this.isLoading = false;
      return;
    }

    this.eventService.getEventById(this.eventId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (event) => {
          this.handleEventDataLoaded(event);
          this.eventUrl = event.url || '';

          this.eventDataService.loadEvent({
            idEvent: event.idEvent || this.eventId,
            eventName: event.eventName || '',
            teamId: event.teamId || '',
            url: event.url || '',
          });
        },
        error: (err) => {
          this.handleEventDataError(err);
        }
      });
  }

  updateLocalTime(timezone: string): void {
    this.dateTimeLocal = this.dateTimeUtc.clone().tz(timezone);
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

  onGeneralFormSubmitted(formData: any): void {
    if (!this.eventId) {
      this.error = 'Event ID is missing - cannot update event';
      return;
    }

    const updatedEvent = {
      idEvent: this.eventId,
      eventName: formData.eventName,
      url: formData.url,
      conferenceHallUrl: formData.conferenceHallUrl,
      timeZone: formData.timeZone,
      visibility: formData.visibility
    };

    this.isLoading = true;

    this.eventService.updateEvent(updatedEvent)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          console.log("Event general information updated successfully", response);
          this.handleEventUpdated(response);
        },
        error: (err) => {
          console.error("Error updating event general information:", err);
          this.handleEventUpdateError(err);
        }
      });
  }

  private handleEventDataLoaded(event: any): void {
    this.eventId = event.idEvent || this.eventId;
    this.eventName = event.eventName || '';
    this.eventUrl = event.url || '';
    this.teamUrl = event.teamUrl || '';
    this.teamId = event.teamId || '';
    this.currentUserRole = 'Owner';
    this.visibility = event.visibility || 'private';

    this.eventGeneralData = {
      eventName: event.eventName,
      url: event.url,
      conferenceHallUrl: event.conferenceHallUrl,
      timeZone: event.timeZone || 'Europe/Paris'
    };

    this.eventInformationData = {
      startDate: event.startDate,
      endDate: event.endDate,
      isOnline: event.isOnline,
      location: event.location,
      description: event.description
    };

    if (event.timeZone) {
      this.timezoneSelector.setValue(event.timeZone);
    }

    this.error = null;
  }

  onInformationFormSubmitted(formData: any): void {
    this.eventDataService.updateEventData({
      startDate: formData.startDate,
      endDate: formData.endDate,
      location: formData.location,
      description: formData.description,
      isOnline: formData.isOnline
    });

    const updatedEvent = this.eventDataService.getCurrentEvent();

    if (!updatedEvent.idEvent) {
      this.error = 'Event ID is missing - cannot update event';
      return;
    }

    this.eventService.updateEvent(updatedEvent).subscribe({
      next: (response) => {
        console.log("Event information updated successfully", response);

        if (this.teamUrl) {
          this.router.navigate(['/team', this.teamUrl]);
        }
      },
      error: (err) => {
        console.error("Error updating event information:", err);
        this.error = 'Failed to update event information. Please try again.';
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

  archiveEvent(): void {
    if (!this.eventId) {
      this.error = 'Event ID is missing - cannot archive event';
      return;
    }

    this.isArchiving = true;
  }

  get deleteConfirmationConfig(): DeleteConfirmationConfig {
    return {
      entityType: 'event',
      entityName: this.eventName,
      title: 'Confirm Event Deletion',
      confirmButtonText: 'Delete permanently',
      loadingText: 'Deleting...'
    };
  }

  onDeleteConfirmed(): void {
    this.deleteEvent();
  }

  onDeleteCancelled(): void {
    this.cancelDeleteEvent();
  }
}

