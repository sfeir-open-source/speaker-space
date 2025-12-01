import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';

import { EventService } from '../../../services/event/event.service';
import { EventDataService } from '../../../services/event/event-data.service';
import { NavbarEventPageComponent } from '../../../components/event/navbar-event-page/navbar-event-page.component';
import { SidebarEventComponent } from '../../../components/event/sidebar-event/sidebar-event.component';
import { ButtonComponent } from '../../../../../shared/button/button.component';
import { EventLogoUploaderComponent } from '../../../components/event/event-logo-uploader/event-logo-uploader.component';

type UserRole = 'Owner' | 'Admin' | 'Member';

interface EventFormData {
  eventName: string;
  eventURL: string;
  weblink: string;
}

@Component({
  selector: 'app-customize-event',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NavbarEventPageComponent,
    SidebarEventComponent,
    ButtonComponent,
    EventLogoUploaderComponent
  ],
  templateUrl: './customize-event.component.html'
})
export class CustomizeEventComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly eventDataService = inject(EventDataService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly eventId = signal<string>('');
  readonly eventUrl = signal<string>('');
  readonly eventName = signal<string>('');
  readonly teamUrl = signal<string>('');
  readonly teamId = signal<string>('');
  readonly logoBase64 = signal<string | null>(null);
  readonly pendingLogoBase64 = signal<string | null>(null);

  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly currentUserRole = signal<UserRole>('Owner');

  readonly isProcessing = computed(() => this.isLoading() || this.isSaving());
  readonly canSave = computed(() =>
    !this.isProcessing() &&
    this.eventForm.valid &&
    this.currentUserRole() === 'Owner'
  );

  readonly eventForm: FormGroup;
  private readonly BASE_URL = 'https://speaker-space.io/event/';

  constructor() {
    this.eventForm = this.createForm();
  }

  ngOnInit(): void {
    this.setupFormEffects();
    this.setupRouteListener();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      eventName: ['', Validators.required],
      eventURL: [{ value: '', disabled: true }],
      weblink: ['']
    });
  }

  private setupFormEffects(): void {
    this.eventForm.get('eventName')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(name => {
        const urlSuffix = this.formatUrlFromName(name || '');
        this.eventForm.patchValue({ eventURL: this.BASE_URL + urlSuffix }, { emitEvent: false });
      });
  }

  private setupRouteListener(): void {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(params => {
          const eventId = params.get('eventId') || '';
          this.eventId.set(eventId);

          if (!eventId) {
            this.error.set('Event ID is missing from route parameters');
            this.isLoading.set(false);
            throw new Error('No event ID');
          }

          this.isLoading.set(true);
          return this.eventService.getEventById(eventId);
        })
      )
      .subscribe({
        next: (event) => this.handleEventLoaded(event),
        error: (err) => this.handleLoadError(err)
      });
  }

  private handleEventLoaded(event: any): void {
    this.eventId.set(event.idEvent || this.eventId());
    this.eventName.set(event.eventName || '');
    this.eventUrl.set(event.url || '');
    this.teamUrl.set(event.teamUrl || '');
    this.teamId.set(event.teamId || '');
    this.logoBase64.set(event.logoBase64 || null);

    const urlSuffix = this.extractUrlSuffix(event);

    this.eventForm.patchValue({
      eventName: event.eventName || '',
      eventURL: this.BASE_URL + urlSuffix,
      weblink: event.weblink || ''
    }, { emitEvent: false });

    this.eventDataService.loadEvent({
      idEvent: event.idEvent || this.eventId(),
      eventName: event.eventName || '',
      teamId: event.teamId || '',
      url: event.url || '',
      teamUrl: event.teamUrl,
      type: event.type,
    });

    this.error.set(null);
    this.isLoading.set(false);
  }

  private handleLoadError(err: any): void {
    console.error('Error loading event:', err);
    this.error.set('Failed to load event details. Please try again.');

    this.isLoading.set(false);
  }

  onImageSelected(base64: string): void {
    this.pendingLogoBase64.set(base64);
  }

  onImageRemoved(): void {
    this.pendingLogoBase64.set('');
  }

  onSubmit(): void {
    if (!this.canSave()) {
      return;
    }

    const eventId = this.eventId();
    if (!eventId) {
      this.error.set('Event ID is missing - cannot update event');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    const formData = this.eventForm.getRawValue() as EventFormData;
    const pendingLogo = this.pendingLogoBase64();

    const updateData: any = {
      idEvent: eventId,
      eventName: formData.eventName,
      url: formData.eventURL.replace(this.BASE_URL, ''),
      webLinkUrl: formData.weblink,
    };

    if (pendingLogo !== null) {
      updateData.logoBase64 = pendingLogo;
    }

    this.eventService.updateEvent(updateData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.handleUpdateSuccess(response);
          this.isSaving.set(false);
        },
        error: (err) => {
          console.error('Update error:', err);
          this.error.set('Failed to update event. Please try again.');
          this.isSaving.set(false);
        }
      });
  }

  private handleUpdateSuccess(response: any): void {
    this.eventName.set(response.eventName || response.name);
    this.eventUrl.set(response.url || '');

    if (this.pendingLogoBase64() !== null) {
      this.logoBase64.set(this.pendingLogoBase64());
      this.pendingLogoBase64.set(null);
    }

    this.navigateToTeam();
  }

  private navigateToTeam(): void {
    const teamId = this.teamId();
    if (teamId) {
      this.router.navigate(['/team', teamId]);
    } else {
      this.error.set('Team ID is missing, cannot navigate back to team page');
    }
  }

  private extractUrlSuffix(event: any): string {
    if (event.url) {
      return event.url.startsWith(this.BASE_URL)
        ? event.url.substring(this.BASE_URL.length)
        : event.url;
    }
    return this.formatUrlFromName(event.eventName || '');
  }

  private formatUrlFromName(name: string): string {
    return name.trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
