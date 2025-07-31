import {Component, OnInit} from '@angular/core';
import {NavbarSpeakerSectionComponent} from '../../components/navbar-speaker-section/navbar-speaker-section.component';
import {BaseDetailComponent} from '../../../admin-management/components/class/base-detail-component';
import {Speaker} from '../../../admin-management/type/session/session';
import {ActivatedRoute} from '@angular/router';
import {EventService} from '../../../admin-management/services/event/event.service';
import {UserContextService} from '../../../../core/services/user-services/user-context.service';
import {SocialLinkService} from '../../../../core/services/social-link-service/social-link.service';
import {SocialLinkInfo} from '../../../../core/types/social-link-info';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-speaker-profile-page',
  imports: [
    NavbarSpeakerSectionComponent
  ],
  templateUrl: './speaker-profile-page.component.html',
  styleUrl: './speaker-profile-page.component.scss'
})
export class SpeakerMyProfilePageComponent extends BaseDetailComponent implements OnInit {
  speaker: Speaker | null = null;

  constructor(
    route: ActivatedRoute,
    eventService: EventService,
    private userContextService: UserContextService,
    private socialLinkService: SocialLinkService
  ) {
    super(route, eventService);
  }

  getParsedSocialLinks(): SocialLinkInfo[] {
    if (!this.speaker?.socialLinks || this.speaker.socialLinks.length === 0) {
      return [];
    }

    return this.speaker.socialLinks.map(link =>
      this.socialLinkService.parseSocialLink(link)
    );
  }

  override onImageError(event: any): void {
    event.target.src = 'img/profil-picture.svg';
  }

  protected subscribeToRouteParams(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.eventId = params.get('eventId') || '';

      if (this.eventId) {
        this.loadEventAndDetailData();
      } else {
        this.error = 'Event ID is missing from route parameters';
        this.isLoading = false;
      }
    });
  }

  protected loadDetailData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userContextService.getMyProfileForEvent(this.eventId)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          next: (speaker: Speaker) => {
            this.speaker = speaker;
            console.log('Loaded speaker profile:', speaker);
            resolve();
          },
          error: (err) => {
            console.error('Error loading speaker profile:', err);
            this.error = 'Failed to load your profile. Please check if you are registered as a speaker for this event.';
            reject(err);
          }
        });
    });
  }
}
