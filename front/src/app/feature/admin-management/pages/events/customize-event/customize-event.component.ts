import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import { finalize, Subscription } from 'rxjs';
import { FormField } from '../../../../../shared/input/interface/form-field';
import { ActivatedRoute } from '@angular/router';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import {InputComponent} from '../../../../../shared/input/input.component';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {SidebarEventComponent} from '../../../components/event/sidebar-event/sidebar-event.component';
import {environment} from '../../../../../../environments/environment.development';

@Component({
  selector: 'app-customize-event',
  standalone: true,
  imports: [
    FormsModule,
    InputComponent,
    NavbarEventPageComponent,
    SidebarEventComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './customize-event.component.html',
  styleUrl: './customize-event.component.scss'
})

export class CustomizeEventComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  activeSection: string = 'event-customize';
  eventId: string = '';
  eventUrl: string = '';
  eventName: string = '';
  isLoading: boolean = true;
  error: string | null = null;
  isDeleting: boolean = false;
  currentUserRole: string = '';
  teamUrl: string = '';
  teamId: string = '';
  eventForm: FormGroup;
  private nameChangeSubscription?: Subscription;
  private routeSubscription?: Subscription;

  selectedImageUrl: string | null = null;
  selectedFile: File | null = null;
  isUploading: boolean = false;
  uploadError: string | null = null;
  isDragOver: boolean = false;

  private readonly MAX_FILE_SIZE = 300 * 1024;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

  otherLinkField: FormField = {
    name: 'weblink',
    label: 'Web Link',
    icon: 'link',
    type: 'text',
  };

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
    this.isLoading = true;
    this.checkForEmailModal();
    this.currentUserRole = 'Owner';
    this.subscribeToRouteParams();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
    if (this.selectedImageUrl) {
      URL.revokeObjectURL(this.selectedImageUrl);
    }
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

  triggerFileInput(): void {
    if (!this.isUploading && this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    this.uploadError = null;

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.uploadError = 'Format de fichier non supporté. Utilisez JPEG, PNG, WEBP ou AVIF.';
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.uploadError = 'Le fichier est trop volumineux. Taille maximum : 300KB.';
      return;
    }

    if (this.selectedImageUrl) {
      URL.revokeObjectURL(this.selectedImageUrl);
    }

    this.selectedFile = file;
    this.selectedImageUrl = URL.createObjectURL(file);
  }

  removeImage(event: Event): void {
    event.stopPropagation();

    if (this.selectedImageUrl) {
      URL.revokeObjectURL(this.selectedImageUrl);
    }

    this.selectedImageUrl = null;
    this.selectedFile = null;
    this.uploadError = null;

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private uploadImage(): void {
    if (!this.selectedFile || !this.eventId) {
      return;
    }

    this.isUploading = true;
    this.uploadError = null;

    const formData = new FormData();
    formData.append('logo', this.selectedFile);
    formData.append('eventId', this.eventId);

    this.eventService.uploadEventLogo(this.eventId, formData)
      .pipe(finalize(() => this.isUploading = false))
      .subscribe({
        next: (response) => {
          console.log('Logo uploaded successfully:', response);
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.uploadError = 'Erreur lors de l\'upload. Veuillez réessayer.';
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

  onSubmit(): void {
    if (this.eventForm.invalid) {
      return;
    }

    if (!this.eventId) {
      this.error = 'Event ID is missing - cannot update event';
      return;
    }

    if (this.selectedFile) {
      this.uploadImage();
    }

    const formValues = this.eventForm.getRawValue();
    const updatedEvent = {
      idEvent: this.eventId,
      eventName: formValues.eventName,
      timeZone: formValues.timeZone,
      url: formValues.eventURL.replace(`${environment.baseUrl}/event/`),
      weblink: formValues.weblink
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
      eventURL: `${environment.baseUrl}/event/` + urlSuffix,
      weblink: event.weblink || ''
    });

    if (event.logoUrl) {
      this.selectedImageUrl = event.logoUrl;
    }

    this.setupNameChangeListener();
    this.error = null;
  }

  private extractOrGenerateUrlSuffix(event: any): string {
    if (event.url) {
      if (event.url.startsWith(`${environment.baseUrl}/event/`)) {
        return event.url.substring(`${environment.baseUrl}/event/`.length);
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
    this.isLoading = false;
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
          this.eventForm.get('eventURL')?.setValue(`${environment.baseUrl}/event/` + urlSuffix);
        } else {
          this.eventForm.get('eventURL')?.setValue(`${environment.baseUrl}/event/`);
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
}
