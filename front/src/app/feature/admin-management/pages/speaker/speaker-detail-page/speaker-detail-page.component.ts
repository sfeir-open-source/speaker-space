import {Component, OnDestroy, OnInit } from '@angular/core';
import {Format, Speaker} from '../../../type/session/session';
import {Subject, Subscription, takeUntil} from 'rxjs';
import {ActivatedRoute } from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {
  NavbarSpeakerPageComponent
} from '../../../components/speaker/navbar-speaker-page/navbar-speaker-page.component';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'app-speaker-detail-page',
  imports: [
    NavbarSpeakerPageComponent,
    MatIcon
  ],
    templateUrl: './speaker-detail-page.component.html',
    styleUrl: './speaker-detail-page.component.scss'
})
export class SpeakerDetailPageComponent implements OnInit, OnDestroy {
  eventId: string = '';
  speakerEmail: string = '';
  eventUrl: string = '';
  eventName: string = '';
  teamId: string = '';
  speaker: Speaker | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();
  private routeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private speakerService: SpeakerService
  ) {}

  ngOnInit(): void {
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
      const encodedEmail = params.get('encodedEmail') || '';

      try {
        this.speakerEmail = this.decodeEmailFromBase64(encodedEmail);
      } catch (error) {
        console.error('Error decoding email from URL:', error);
        this.error = 'Invalid speaker identifier in URL';
        this.isLoading = false;
        return;
      }

      if (this.eventId && this.speakerEmail) {
        this.loadEventAndSpeakerData();
      } else {
        this.error = 'Event ID or Speaker Email is missing from route parameters';
        this.isLoading = false;
      }
    });
  }

  private decodeEmailFromBase64(encodedEmail: string): string {
    if (!encodedEmail || encodedEmail.trim() === '') {
      throw new Error('Encoded email cannot be null or empty');
    }

    try {
      let base64 = encodedEmail
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      while (base64.length % 4) {
        base64 += '=';
      }

      return atob(base64);
    } catch (error) {
      throw new Error('Invalid Base64 encoding: ' + error);
    }
  }

  private loadEventAndSpeakerData(): void {
    this.isLoading = true;

    Promise.all([
      this.loadEventData(),
      this.loadSpeakerData()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  private loadEventData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventService.getEventById(this.eventId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (event) => {
            this.eventUrl = event.url || '';
            this.eventName = event.eventName || '';
            this.teamId = event.teamId || '';
            resolve();
          },
          error: (err) => {
            console.error('Error loading event:', err);
            this.error = 'Failed to load event data';
            reject(err);
          }
        });
    });
  }

  private loadSpeakerData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.speakerService.getSpeakerByEmail(this.eventId, this.speakerEmail)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (speaker: Speaker) => {
            this.speaker = speaker;
            resolve();
          },
          error: (err) => {
            this.error = 'Failed to load speaker data. Please check if the speaker exists.';
            reject(err);
          }
        });
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'img/profil-picture.svg';
  }
}
