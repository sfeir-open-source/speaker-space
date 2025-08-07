import {Component, OnInit, OnDestroy, DestroyRef, inject, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import { finalize, Subscription } from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {SidebarEventComponent} from '../../../components/event/sidebar-event/sidebar-event.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ImageUploadConfig, ImageUploadResult} from '../../../../../shared/image-upload/image-upload.type';
import {ImageUploadComponent} from '../../../../../shared/image-upload/image-upload/image-upload.component';

@Component({
  selector: 'app-customize-event',
  standalone: true,
  imports: [
    FormsModule,
    NavbarEventPageComponent,
    SidebarEventComponent,
    ReactiveFormsModule,
    ImageUploadComponent,
  ],
  templateUrl: './customize-event.component.html',
  styleUrl: './customize-event.component.scss'
})

export class CustomizeEventComponent implements OnInit, OnDestroy {
  @ViewChild('imageUpload') imageUploadComponent!: ImageUploadComponent;

  logoUploadConfig: ImageUploadConfig = {
    title: 'Customize event logo',
    description: 'Upload a beautiful logo for your event.',
    acceptedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    maxFileSize: 300 * 1024,
    recommendedSize: '500x500',
    maxSizeText: '300kB max',
    optimizationLink: 'https://squoosh.app',
    width: 'w-32',
    height: 'h-32',
    shape: 'square'
  };

  selectedImageResult: ImageUploadResult | null = null;
  activeSection: string = 'event-customize';
  eventId: string = '';
  eventUrl: string = '';
  eventName: string = '';
  error: string | null = null;
  isDeleting: boolean = false;
  currentUserRole: string = '';
  teamUrl: string = '';
  teamId: string = '';
  eventForm: FormGroup;
  initialImageUrl: string | null = null;
  isLoadingPage: boolean = true;
  isSavingImage: boolean = false;
  isDeletingImage: boolean = false;
  isSavingForm: boolean = false;

  protected readonly _destroyRef = inject(DestroyRef);
  private nameChangeSubscription?: Subscription;
  private routeSubscription?: Subscription;
  readonly BASE_URL : string = 'https://speaker-space.io/event/';

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private eventDataService: EventDataService,
    private fb: FormBuilder,
  ) {
    this.eventForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.activeSection = 'event-customize';
    this.isLoadingPage = true;
    this.checkForEmailModal();
    this.currentUserRole = 'Owner';
    this.subscribeToRouteParams();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  private deleteImageFromServer(): void {
    if (!this.eventId) {
      this.error = 'Event ID is missing - cannot delete image';
      return;
    }

    this.isDeletingImage = true;
    this.error = null;

    const updateData = {
      idEvent: this.eventId,
      logoBase64: ''
    };

    this.eventService.updateEvent(updateData).subscribe({
      next: (response) => {
        console.log('Logo deleted successfully:', response);

        if (!response.logoBase64 || response.logoBase64.trim() === '') {
          this.resetLocalImageState();
          console.log('Image successfully removed from server');
        } else {
          this.error = 'Error: Image was not deleted from server.';
        }
      },
      error: (err) => {
        console.error('Error deleting logo:', err);
        this.error = 'Error deleting image. Please try again.';
      },
      complete: () => {
        this.isDeletingImage = false;
        if (this.imageUploadComponent) {
          this.imageUploadComponent.stopDeleting();
        }
      }
    });
  }

  private resetLocalImageState(): void {
    this.selectedImageResult = null;
    this.initialImageUrl = null;
    this.error = null;
  }


  onImageSelected(result: ImageUploadResult): void {
    this.selectedImageResult = result;
    this.error = null;
  }

  private async uploadImageAndNavigate(): Promise<void> {
    if (!this.selectedImageResult || !this.eventId) {
      return;
    }

    this.isSavingImage = true;

    try {
      const updateData = {
        idEvent: this.eventId,
        logoBase64: this.selectedImageResult.base64
      };

      this.eventService.updateEvent(updateData).subscribe({
        next: (response) => {
          console.log('Logo saved successfully:', response);
          this.initialImageUrl = this.selectedImageResult!.base64;
          this.selectedImageResult = null;
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.error = 'Error saving logo. Please try again.';
        },
        complete: () => {
          this.isSavingImage  = false;
        }
      });

    } catch (error) {
      console.error('Error processing image:', error);
      this.error = 'Error processing image.';
      this.isSavingImage  = false;
    }
  }

  onImageUploadError(error: string): void {
    this.error = error;
    this.selectedImageResult = null;
  }

  onImageRemoved(): void {
    const isExistingServerImage = this.initialImageUrl &&
      this.initialImageUrl.startsWith('data:image');

    if (isExistingServerImage) {
      this.deleteImageFromServer();
    } else {
      this.resetLocalImageState();
    }
  }


  onSubmit(): void {
    if (this.eventForm.invalid) {
      return;
    }

    if (!this.eventId) {
      this.error = 'Event ID is missing - cannot update event';
      return;
    }

    if (this.selectedImageResult) {
      this.uploadImageAndNavigate();
      return;
    }

    this.updateEventAndNavigate();
  }

  private handleEventDataLoaded(event: any): void {
    this.eventId = event.idEvent || this.eventId;
    this.eventName = event.eventName || '';
    this.eventUrl = event.url || '';
    this.teamUrl = event.teamUrl || '';
    this.teamId = event.teamId || '';
    this.currentUserRole = 'Owner';

    const urlSuffix: string = this.extractOrGenerateUrlSuffix(event);

    this.eventForm.patchValue({
      eventName: event.eventName || '',
      eventURL: this.BASE_URL + urlSuffix,
      weblink: event.weblink || ''
    });

    if (event.logoBase64) {
      this.initialImageUrl = event.logoBase64;
    }

    this.setupNameChangeListener();
    this.error = null;
  }

  private updateEventAndNavigate(): void {
    const formValues = this.eventForm.getRawValue();
    const updatedEvent = {
      idEvent: this.eventId,
      eventName: formValues.eventName,
      url: formValues.eventURL.replace(this.BASE_URL, ''),
      webLinkUrl: formValues.weblink,
    };

    this.isSavingForm = true;

    this.eventService.updateEvent(updatedEvent)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isSavingForm = false))
      .subscribe({
        next: (response) => {
          this.handleEventUpdated(response);
        },
        error: (err) => {
          this.handleEventUpdateError(err);
        }
      });
  }

  private subscribeToRouteParams(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.eventId = params.get('eventId') || '';

      if (this.eventId) {
        this.loadEventData();
      } else {
        this.error = 'Event ID is missing from route parameters';
        this.isLoadingPage = false;
      }
    });
  }

  loadEventData(): void {
    if (!this.eventId) {
      this.error = 'Event ID is required to load event data';
      this.isLoadingPage = false;
      return;
    }

    this.eventService.getEventById(this.eventId)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoadingPage = false))
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
            type: event.type,
          });
        },
        error: (err) => {
          this.handleEventDataError(err);
        }
      });
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      eventName: [{value: '', disabled: false}, Validators.required],
      eventURL: {value: '', disabled: true},
      weblink: ['']
    });
  }

  private checkForEmailModal(): void {
    const params = new URLSearchParams(window.location.search);
    const showEmailModal: string | null = params.get('showEmailModal');

    if (showEmailModal === 'true') {
      const modal = document.getElementById('crud-modal');
      if (modal) {
        modal.classList.remove('hidden');
      }
    }
  }

  private extractOrGenerateUrlSuffix(event: any): string {
    if (event.url) {
      if (event.url.startsWith(this.BASE_URL)) {
        return event.url.substring(this.BASE_URL.length);
      }
      return event.url;
    }

    return this.formatUrlFromName(event.eventName || '');
  }

  private formatUrlFromName(name: string): string {
    return name.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  private handleEventDataError(err: any): void {
    console.error('Error loading event data:', err);
    this.error = 'Failed to load event details. Please try again.';
    this.isLoadingPage  = false;
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

  private handleEventUpdated(event: any): void {
    this.eventName = event.eventName || event.name;
    this.eventUrl = event.url || '';
  }

  private handleEventUpdateError(err: any): void {
    this.error = 'Failed to update event. Please try again.';
  }

  private unsubscribeAll(): void {
    if (this.nameChangeSubscription) {
      this.nameChangeSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  get isProcessing(): boolean {
    return this.isSavingImage || this.isDeletingImage || this.isSavingForm;
  }

  get canShowContent(): boolean {
    return !this.isLoadingPage && !this.error;
  }
}
