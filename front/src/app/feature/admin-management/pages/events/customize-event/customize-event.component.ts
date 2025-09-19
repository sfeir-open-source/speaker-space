import { Component, viewChild, ElementRef, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { finalize, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import { NavbarEventPageComponent } from '../../../components/event/navbar-event-page/navbar-event-page.component';
import { SidebarEventComponent } from '../../../components/event/sidebar-event/sidebar-event.component';

type UserRole = 'Owner' | 'Admin' | 'Member';
type ActiveSection = 'event-customize';

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
  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly activeSection = signal<ActiveSection>('event-customize');
  readonly eventId = signal<string>('');
  readonly eventUrl = signal<string>('');
  readonly eventName = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly isDeleting = signal<boolean>(false);
  readonly currentUserRole = signal<UserRole>('Owner');
  readonly teamUrl = signal<string>('');
  readonly teamId = signal<string>('');

  readonly selectedImageUrl = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly isUploading = signal<boolean>(false);
  readonly uploadError = signal<string | null>(null);
  readonly isDragOver = signal<boolean>(false);

  readonly isProcessing = computed(() => this.isUploading() || this.isLoading());
  readonly canUpload = computed(() => !this.isUploading() && this.fileInput());
  readonly hasSelectedImage = computed(() => !!this.selectedImageUrl() && !this.isUploading());
  readonly showUploadArea = computed(() => !this.selectedImageUrl() && !this.isUploading());

  eventForm: FormGroup;
  private nameChangeSubscription?: Subscription;
  private routeSubscription?: Subscription;

  private readonly BASE_URL = 'https://speaker-space.io/event/';
  private readonly MAX_FILE_SIZE = 300 * 1024;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventService: EventService,
    private readonly eventDataService: EventDataService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
  ) {
    this.eventForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.activeSection.set('event-customize');
    this.isLoading.set(true);
    this.checkForEmailModal();
    this.currentUserRole.set('Owner');
    this.subscribeToRouteParams();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
    this.cleanupImageUrl();
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
    this.eventId.set(event.idEvent || this.eventId());
    this.eventName.set(event.eventName || '');
    this.eventUrl.set(event.url || '');
    this.teamUrl.set(event.teamUrl || '');
    this.teamId.set(event.teamId || '');
    this.currentUserRole.set('Owner');

    const urlSuffix = this.extractOrGenerateUrlSuffix(event);

    this.eventForm.patchValue({
      eventName: event.eventName || '',
      eventURL: this.BASE_URL + urlSuffix,
      weblink: event.weblink || ''
    });

    if (event.logoBase64) {
      this.selectedImageUrl.set(event.logoBase64);
    }

    this.setupNameChangeListener();
    this.error.set(null);
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      return;
    }

    if (!this.eventId()) {
      this.error.set('Event ID is missing - cannot update event');
      return;
    }

    if (this.selectedFile()) {
      this.uploadImageAndNavigate();
      return;
    }

    this.updateEventAndNavigate();
  }

  private async uploadImageAndNavigate(): Promise<void> {
    const file = this.selectedFile();
    const eventId = this.eventId();

    if (!file || !eventId) {
      return;
    }

    this.isUploading.set(true);
    this.uploadError.set(null);

    try {
      const compressedFile = await this.compressImage(file);

      if (compressedFile.size > this.MAX_FILE_SIZE) {
        this.uploadError.set('L\'image est encore trop volumineuse après compression. Essayez une image plus petite.');
        return;
      }

      const base64Image = await this.convertToBase64(compressedFile);
      const updateData = {
        idEvent: eventId,
        logoBase64: base64Image
      };

      this.eventService.updateEvent(updateData).subscribe({
        next: (response) => {
          console.log('Logo saved successfully:', response);
          this.handleImageUploadSuccess(base64Image);
          this.navigateToTeam();
        },
        error: (err) => {
          this.handleImageUploadError(err);
        },
        complete: () => {
          this.isUploading.set(false);
        }
      });

    } catch (error) {
      console.error('Error processing image:', error);
      this.uploadError.set('Erreur lors du traitement de l\'image.');
      this.isUploading.set(false);
    }
  }

  private updateEventAndNavigate(): void {
    const formValues = this.eventForm.getRawValue();
    const updatedEvent = {
      idEvent: this.eventId(),
      eventName: formValues.eventName,
      url: formValues.eventURL.replace(this.BASE_URL, ''),
      webLinkUrl: formValues.weblink,
    };

    this.isLoading.set(true);

    this.eventService.updateEvent(updatedEvent)
      .pipe(finalize(() => this.isLoading.set(false)))
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
    const teamId = this.teamId();
    if (teamId) {
      this.router.navigate(['/team', teamId]);
    } else {
      this.error.set('Team ID is missing, cannot navigate back to team page');
    }
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
      .pipe(finalize(() => this.isLoading.set(false)))
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
            type: event.type,
          });
        },
        error: (err) => {
          this.handleEventDataError(err);
        }
      });
  }

  triggerFileInput(): void {
    const fileInputRef = this.fileInput();
    if (this.canUpload() && fileInputRef) {
      fileInputRef.nativeElement.click();
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
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    this.uploadError.set(null);

    if (!this.ALLOWED_TYPES.includes(file.type as any)) {
      this.uploadError.set('Unsupported file format. Use JPEG, PNG, WEBP, or AVIF.');
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.uploadError.set('The file is too large. Maximum size: 300KB.');
      return;
    }

    this.cleanupImageUrl();
    this.selectedFile.set(file);
    this.selectedImageUrl.set(URL.createObjectURL(file));
  }

  onImageError(event: Event): void {
    console.error('Error loading image:', event);
    this.uploadError.set('Erreur lors du chargement de l\'image.');
    this.selectedImageUrl.set(null);
  }

  removeImage(event: Event): void {
    event.stopPropagation();

    const imageUrl = this.selectedImageUrl();
    const isExistingImage = imageUrl && imageUrl.startsWith('data:image');

    if (isExistingImage) {
      this.removeImageFromServer();
    } else {
      this.resetImageState();
    }
  }

  private removeImageFromServer(): void {
    const updateData = {
      idEvent: this.eventId(),
      logoBase64: ''
    };

    this.isUploading.set(true);
    this.eventService.updateEvent(updateData).subscribe({
      next: (response) => {
        console.log('Logo deleted successfully', response);
        if (!response.logoBase64 || response.logoBase64.trim() === '') {
          this.resetImageState();
        } else {
          this.uploadError.set('Erreur: le logo n\'a pas été supprimé côté serveur.');
        }
      },
      error: (err) => {
        console.error('Error deleting logo:', err);
        this.uploadError.set('Erreur lors de la suppression du logo.');
      },
      complete: () => {
        this.isUploading.set(false);
      }
    });
  }

  private resetImageState(): void {
    this.cleanupImageUrl();
    this.selectedImageUrl.set(null);
    this.selectedFile.set(null);
    this.uploadError.set(null);

    const fileInputRef = this.fileInput();
    if (fileInputRef) {
      fileInputRef.nativeElement.value = '';
    }
  }

  private cleanupImageUrl(): void {
    const imageUrl = this.selectedImageUrl();
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
  }

  private handleImageUploadSuccess(base64Image: string): void {
    this.selectedImageUrl.set(base64Image);
    this.cleanupImageUrl();
  }

  private handleImageUploadError(err: any): void {
    console.error('Upload error:', err);
    this.uploadError.set('Erreur lors de la sauvegarde. Veuillez réessayer.');
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      eventName: [{ value: '', disabled: false }, Validators.required],
      eventURL: { value: '', disabled: true },
      weblink: ['']
    });
  }

  private checkForEmailModal(): void {
    this.route.queryParams.subscribe(params => {
      const showEmailModal = params['showEmailModal'];

      if (showEmailModal === 'true') {
        const modal = document.getElementById('crud-modal');
        modal?.classList.remove('hidden');
      }
    });
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
    this.error.set('Failed to load event details. Please try again.');
    this.isLoading.set(false);
  }

  private setupNameChangeListener(): void {
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
    this.eventName.set(event.eventName || event.name);
    this.eventUrl.set(event.url || '');
  }

  private handleEventUpdateError(err: any): void {
    this.error.set('Failed to update event. Please try again.');
  }

  private unsubscribeAll(): void {
    this.nameChangeSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
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
}
