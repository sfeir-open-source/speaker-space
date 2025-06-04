import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import { finalize, Subscription } from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import {NavbarEventPageComponent} from '../../../components/event/navbar-event-page/navbar-event-page.component';
import {SidebarEventComponent} from '../../../components/event/sidebar-event/sidebar-event.component';

@Component({
  selector: 'app-customize-event',
  standalone: true,
  imports: [
    FormsModule,
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
  readonly BASE_URL = 'https://speaker-space.io/event/';

  selectedImageUrl: string | null = null;
  selectedFile: File | null = null;
  isUploading: boolean = false;
  uploadError: string | null = null;
  isDragOver: boolean = false;

  private readonly MAX_FILE_SIZE : number = 300 * 1024;
  private readonly ALLOWED_TYPES : string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private eventDataService: EventDataService,
    private fb: FormBuilder,
    private router: Router,
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

  private compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const maxSize = 500;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = height * (maxSize / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = width * (maxSize / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
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
      this.selectedImageUrl = event.logoBase64;
    }

    this.setupNameChangeListener();
    this.error = null;
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
      this.uploadImageAndNavigate();
      return;
    }

    this.updateEventAndNavigate();
  }

  private async uploadImageAndNavigate(): Promise<void> {
    if (!this.selectedFile || !this.eventId) {
      return;
    }

    this.isUploading = true;
    this.uploadError = null;

    try {
      const compressedFile : File = await this.compressImage(this.selectedFile);

      if (compressedFile.size > this.MAX_FILE_SIZE) {
        this.uploadError = 'L\'image est encore trop volumineuse après compression. Essayez une image plus petite.';
        return;
      }

      const base64Image : string = await this.convertToBase64(compressedFile);

      const updateData = {
        idEvent: this.eventId,
        logoBase64: base64Image
      };

      this.eventService.updateEvent(updateData).subscribe({
        next: (response) => {
          console.log('Logo saved successfully:', response);
          this.selectedImageUrl = base64Image;

          if (this.selectedImageUrl && this.selectedImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(this.selectedImageUrl);
          }

          this.navigateToTeam();
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.uploadError = 'Erreur lors de la sauvegarde. Veuillez réessayer.';
        },
        complete: () => {
          this.isUploading = false;
        }
      });

    } catch (error) {
      console.error('Error processing image:', error);
      this.uploadError = 'Erreur lors du traitement de l\'image.';
      this.isUploading = false;
    }
  }

  private updateEventAndNavigate(): void {
    const formValues = this.eventForm.getRawValue();
    const updatedEvent = {
      idEvent: this.eventId,
      eventName: formValues.eventName,
      url: formValues.eventURL.replace(this.BASE_URL, ''),
      webLinkUrl: formValues.weblink,
    };

    this.isLoading = true;

    this.eventService.updateEvent(updatedEvent)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.handleEventUpdated(response);
          this.navigateToTeam();
        },
        error: (err) => {
          this.handleEventUpdateError(err);
        }
      });
  }

  private navigateToTeam(): void {
    if (this.teamId) {
      this.router.navigate(['/team', this.teamId]);
    } else {
      this.error = 'Team ID is missing, cannot navigate back to team page';
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
            teamUrl: event.teamUrl,
            type: event.type,
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
      this.uploadError = 'Unsupported file format. Use JPEG, PNG, WEBP, or AVIF.';
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.uploadError = 'The file is too large. Maximum size: 300KB.';
      return;
    }

    if (this.selectedImageUrl) {
      URL.revokeObjectURL(this.selectedImageUrl);
    }

    this.selectedFile = file;
    this.selectedImageUrl = URL.createObjectURL(file);
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

  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  onImageError(event: Event): void {
    console.error('Error loading image:', event);
    this.uploadError = 'Erreur lors du chargement de l\'image.';
    this.selectedImageUrl = null;
  }

  removeImage(event: Event): void {
    event.stopPropagation();

    const isExistingImage = this.selectedImageUrl && this.selectedImageUrl.startsWith('data:image');

    if (isExistingImage) {
      const updateData = {
        idEvent: this.eventId,
        logoBase64: ''
      };

      this.isUploading = true;
      this.eventService.updateEvent(updateData).subscribe({
        next: (response) => {
          console.log('Logo deleted successfully', response);
          if (!response.logoBase64 || response.logoBase64.trim() === '') {
            this.resetImageState();
          } else {
            this.uploadError = 'Erreur: le logo n\'a pas été supprimé côté serveur.';
          }
        },
        error: (err) => {
          console.error('Error deleting logo:', err);
          this.uploadError = 'Erreur lors de la suppression du logo.';
        },
        complete: () => {
          this.isUploading = false;
        }
      });
    } else {
      this.resetImageState();
    }
  }

  private resetImageState(): void {
    if (this.selectedImageUrl && this.selectedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.selectedImageUrl);
    }

    this.selectedImageUrl = null;
    this.selectedFile = null;
    this.uploadError = null;

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  get isProcessing(): boolean {
    return this.isUploading || this.isLoading;
  }
}
