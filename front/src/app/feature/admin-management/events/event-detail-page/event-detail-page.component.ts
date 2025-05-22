import { Component } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputComponent} from '../../../../shared/input/input.component';
import {FormField} from '../../../../shared/input/interface/form-field';
import {finalize, Subscription} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../../../core/login/services/auth.service';
import {EventService} from '../../services/event/event.service';
import {DeleteEventPopupComponent} from '../../components/event/delete-event-popup/delete-event-popup.component';
import {SidebarEventComponent} from '../../components/event/sidebar-event/sidebar-event.component';
import {NavbarEventPageComponent} from '../../components/event/navbar-event-page/navbar-event-page.component';
import {EventDataService} from '../../services/event/event-data.service';

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [
    NavbarEventPageComponent,
    FormsModule,
    InputComponent,
    ReactiveFormsModule,
    DeleteEventPopupComponent,
    SidebarEventComponent,
  ],
  templateUrl: './event-detail-page.component.html',
  styleUrl: './event-detail-page.component.scss'
})
export class EventDetailPageComponent {
  readonly BASE_URL = 'https://speaker-space.io/event/';

  activeSection: string = 'settings-general';
  eventUrl : string = '';
  eventId : string = '';
  eventName: string  = '';
  isLoading : boolean = true;
  error: string | null = null;
  isDeleting : boolean = false;
  showDeleteConfirmation : boolean = false;
  currentUserRole: string = '';

  eventForm: FormGroup;
  private nameChangeSubscription?: Subscription;
  private routeSubscription?: Subscription;

  formFields: FormField[] = [
    {
      name: 'eventName',
      label: 'Event name',
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
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private eventDataService: EventDataService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.eventForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.activeSection = 'settings-general';
    this.isLoading = true;
    this.checkForEmailModal();
    this.subscribeToRouteParams();
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

  private updateFormControlsBasedOnRole(): void {
    if (this.currentUserRole !== 'Owner') {
      this.eventForm.get('eventName')?.disable();
    } else {
      this.eventForm.get('eventName')?.enable();
    }
  }

  private handleEventDataLoaded(event: any): void {
    this.eventId = event.id || '';
    this.eventName = event.name;

    const urlSuffix = this.extractOrGenerateUrlSuffix(event);

    this.eventForm.patchValue({
      eventName: event.name,
      eventURL: this.BASE_URL + urlSuffix
    });

    this.setupNameChangeListener();
    this.error = null;
  }

  private extractOrGenerateUrlSuffix(event: any): string {
    if (event.url) {
      if (event.url.startsWith(this.BASE_URL)) {
        return event.url.substring(this.BASE_URL.length);
      }
      return event.url;
    }

    return this.formatUrlFromName(event.name);
  }

  private formatUrlFromName(name: string): string {
    return name.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  private handleEventDataError(err: any): void {
    this.error = 'Failed to load event details. Please try again.';
  }

  setupNameChangeListener(): void {
    if (this.nameChangeSubscription) {
      this.nameChangeSubscription.unsubscribe();
    }

    const nameControl = this.eventForm.get('eventName');
    if (nameControl) {
      this.nameChangeSubscription = nameControl.valueChanges.subscribe(value => {
        if (value) {
          const urlSuffix = this.formatUrlFromName(value);
          this.eventForm.get('eventURL')?.setValue(this.BASE_URL + urlSuffix);
        } else {
          this.eventForm.get('eventURL')?.setValue(this.BASE_URL);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      return;
    }

    if (!this.eventId) {
      this.error = 'Event ID is missing';
      return;
    }

    const formValues = this.eventForm.getRawValue();
    const updatedEvent = {
      name: formValues.eventName,
      url: formValues.eventURL
    };

    this.isLoading = true;

    // this.eventService.updateEvent(this.eventId, updatedEvent)
    //   .pipe(finalize(() => this.isLoading = false))
    //   .subscribe({
    //     next: this.handleEventUpdated.bind(this),
    //     error: this.handleEventUpdateError.bind(this)
    //   });
  }

  private handleEventUpdated(event: any): void {
    this.eventName = event.name;
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
      this.error = 'Event ID is missing';
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
          this.error = 'Failed to delete event. Please try again.';
        }
      });
  }

  getFormControl(name: string): FormControl {
    return this.eventForm.get(name) as FormControl;
  }

  private unsubscribeAll(): void {
    if (this.nameChangeSubscription) {
      this.nameChangeSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  private subscribeToRouteParams(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.eventId = params.get('eventId') || '';

      if (this.eventId) {
        this.loadEventData();
      } else {
        this.error = 'Event ID is missing';
        this.isLoading = false;
      }
    });
  }

  loadEventData(): void {
    this.eventService.getEventById(this.eventId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (event) => {
          this.handleEventDataLoaded(event);

          this.eventUrl = event.url || '';

          // this.eventDataService.loadEvent({
          //   idEvent: event.idEvent,
          //   eventName: event.eventName,
          //   teamId: event.teamId,
          //   // autres propriétés si nécessaire
          // });
        },
        error: this.handleEventDataError.bind(this)
      });
  }
}
