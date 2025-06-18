import {Component} from '@angular/core';
import {Speaker} from '../../../type/session/session';
import {takeUntil} from 'rxjs';
import {ActivatedRoute } from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {
  NavbarSpeakerPageComponent
} from '../../../components/speaker/navbar-speaker-page/navbar-speaker-page.component';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {BaseDetailComponent} from '../../../components/class/bade-detail-component';
import {EmailEncoderService} from '../../../components/services/email-encoder.service';
import {SocialLinkService} from '../../../../../core/services/social-link-service/social-link.service';
import {SocialLinkInfo} from '../../../../../core/types/social-link-info';

@Component({
    selector: 'app-speaker-detail-page',
  imports: [
    NavbarSpeakerPageComponent,
  ],
    templateUrl: './speaker-detail-page.component.html',
    styleUrl: './speaker-detail-page.component.scss'
})
export class SpeakerDetailPageComponent extends BaseDetailComponent {
  speakerEmail: string = '';
  speaker: Speaker | null = null;

  constructor(
    route: ActivatedRoute,
    eventService: EventService,
    private speakerService: SpeakerService,
    private emailEncoderService: EmailEncoderService,
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

  protected subscribeToRouteParams(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.eventId = params.get('eventId') || '';
      const encodedEmail : string = params.get('encodedEmail') || '';

      try {
        this.speakerEmail = this.emailEncoderService.decodeFromBase64(encodedEmail);
      } catch (error) {
        this.error = 'Invalid speaker identifier in URL';
        this.isLoading = false;
        return;
      }

      if (this.eventId && this.speakerEmail) {
        this.loadEventAndDetailData();
      } else {
        this.error = 'Event ID or Speaker Email is missing from route parameters';
        this.isLoading = false;
      }
    });
  }

  protected loadDetailData(): Promise<void> {
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
}
