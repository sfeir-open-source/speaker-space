import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { NavbarSpeakerPageComponent } from '../navbar-speaker-page/navbar-speaker-page.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionImportData, Speaker } from '../../../type/session/session';
import { BaseDetailComponent } from '../../class/base-detail-component';
import { SpeakerService } from '../../../services/speaker/speaker.service';
import { UserContextService } from '../../../../../core/services/user-services/user-context.service';
import { SocialLinkService } from '../../../../../core/services/social-link-service/social-link.service';
import { ActivatedRoute } from '@angular/router';
import { EventService } from '../../../services/event/event.service';
import { SocialLinkInfo } from '../../../../../core/types/social-link-info';
import { NavbarSpeakerSectionComponent } from '../../../../speaker-section/components/navbar-speaker-section/navbar-speaker-section.component';

@Component({
  selector: 'app-speaker-profile-unified',
  imports: [
    NavbarSpeakerSectionComponent,
    NavbarSpeakerPageComponent
  ],
  templateUrl: './speaker-profile-unified.component.html',
  styleUrl: './speaker-profile-unified.component.scss'
})
export class SpeakerProfileUnifiedComponent extends BaseDetailComponent implements OnInit {
  @Input() isMyProfile: boolean = false;

  speaker: Speaker | null = null;
  speakerId: string = '';
  syncing = signal(false);
  userSessions = signal<SessionImportData[]>([]);

  private readonly speakerService = inject(SpeakerService);
  private readonly userContextService = inject(UserContextService);
  private readonly socialLinkService = inject(SocialLinkService);

  constructor(
    route: ActivatedRoute,
    eventService: EventService
  ) {
    super(route, eventService);
  }

  override ngOnInit(): void {
    super.ngOnInit();

    if (this.isMyProfile) {
      this.loadUserSessions();
    }
  }

  getParsedSocialLinks(): SocialLinkInfo[] {
    if (!this.speaker?.socialLinks || this.speaker.socialLinks.length === 0) {
      return [];
    }
    return this.speaker.socialLinks.map(link =>
      this.socialLinkService.parseSocialLink(link)
    );
  }

  protected subscribeToRouteParams(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.eventId = params.get('eventId') || '';
      this.speakerId = params.get('speakerId') || '';
      this.isMyProfile = this.route.snapshot.url.some(segment =>
        segment.path === 'my-profile'
      );

      if (this.eventId && (this.speakerId || this.isMyProfile)) {
        this.loadEventAndDetailData();
      } else {
        this.error = 'Missing required route parameters';
        this.isLoading = false;
      }
    });
  }

  protected loadDetailData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const observable = this.isMyProfile
        ? this.userContextService.getMyProfileForEvent(this.eventId)
        : this.speakerService.getSpeakerById(this.eventId, this.speakerId);

      observable
        .pipe(
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (speaker: Speaker | null) => {
            if (speaker) {
              this.speaker = speaker;
              if (this.isMyProfile) {
                this.loadUserSessions();
              }
              resolve();
            } else {
              this.error = this.isMyProfile
                ? 'Profil speaker non trouvé. Les données sont en cours de synchronisation.'
                : 'Speaker introuvable.';
              reject(new Error('Speaker not found'));
            }
          },
          error: (err: any) => {
            console.error('Error loading speaker data:', err);
            this.error = this.isMyProfile
              ? 'Erreur lors du chargement de votre profil speaker.'
              : 'Erreur lors du chargement des données du speaker.';
            reject(err);
          }
        });
    });
  }

  private loadUserSessions(): void {
    if (!this.isMyProfile || !this.eventId) return;

    this.userContextService.getSessionsForCurrentUser(this.eventId)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (sessions) => {
          console.log('User sessions loaded:', sessions);
          this.userSessions.set(sessions);
        },
        error: (error) => {
          console.error('Error loading user sessions:', error);
          this.userSessions.set([]);
        }
      });
  }

  override onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'img/profil-picture.svg';
  }
}
