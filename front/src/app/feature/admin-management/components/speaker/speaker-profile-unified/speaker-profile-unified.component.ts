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
import { finalize } from 'rxjs/operators';
import { UserSpeakerService } from '../../../../../core/services/user-services/user-speaker.service';
import { UserStateService } from '../../../../../core/services/user-services/user-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  private readonly userSpeakerService = inject(UserSpeakerService);
  private readonly socialLinkService = inject(SocialLinkService);
  private readonly userState = inject(UserStateService);
  private readonly snackBar = inject(MatSnackBar);

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
                ? 'Aucun profil speaker trouvé pour cet événement. Vérifiez que vous êtes bien enregistré comme speaker.'
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

    this.userSpeakerService.getUserSessions(this.eventId)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (sessions) => {
          this.userSessions.set(sessions);
        },
        error: (error) => {
          console.error('Error loading user sessions:', error);
        }
      });
  }

  syncSpeakerData(): void {
    if (!this.isMyProfile || this.syncing()) return;

    this.syncing.set(true);

    this.userSpeakerService.syncSpeakerData(this.eventId)
      .pipe(
        finalize(() => this.syncing.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Données synchronisées avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });

          this.loadDetailData();
          this.loadUserSessions();
        },
        error: (error) => {
          console.error('Error syncing speaker data:', error);
          this.snackBar.open('Erreur lors de la synchronisation', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  isLinkedToUser(): boolean {
    if (!this.isMyProfile || !this.speaker?.email) return false;

    const userEmail = this.userState.email();
    return userEmail.toLowerCase() === this.speaker.email.toLowerCase();
  }

  formatSessionTime(start: Date, end: Date): string {
    if (!start || !end) return '';

    const startTime = new Date(start).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = new Date(end).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const startDate = new Date(start).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });

    return `${startDate} • ${startTime} - ${endTime}`;
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'Accepté';
      case 'rejected':
        return 'Rejeté';
      case 'pending':
        return 'En attente';
      default:
        return status || 'Inconnu';
    }
  }

  override onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'img/profil-picture.svg';
  }
}
