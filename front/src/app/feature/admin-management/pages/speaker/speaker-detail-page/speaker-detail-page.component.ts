import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';

import { Speaker } from '../../../type/session/session';
import { NavbarSpeakerPageComponent } from '../../../components/speaker/navbar-speaker-page/navbar-speaker-page.component';
import { SpeakerService } from '../../../services/speaker/speaker.service';
import { SocialLinkService } from '../../../../../core/services/social-link-service/social-link.service';
import { SocialLinkInfo } from '../../../../../core/types/social-link-info';
import { BaseDetailService, DetailState } from '../../../components/services/base-detail.service';

@Component({
  selector: 'app-speaker-detail-page',
  imports: [
    NavbarSpeakerPageComponent,
    AsyncPipe
  ],
  providers: [BaseDetailService],
  templateUrl: './speaker-detail-page.component.html',
  styleUrl: './speaker-detail-page.component.scss'
})
export class SpeakerDetailPageComponent implements OnInit, OnDestroy {
  speakerId: string = '';
  speaker: Speaker | null = null;

  readonly detailService = inject(BaseDetailService);
  readonly state$: Observable<DetailState> = this.detailService.state$;

  constructor(
    private route: ActivatedRoute,
    private speakerService: SpeakerService,
    private socialLinkService: SocialLinkService
  ) {}

  ngOnInit(): void {
    this.initializeRouteSubscription();
  }

  ngOnDestroy(): void {
    this.detailService.destroy();
  }

  private initializeRouteSubscription(): void {
    this.detailService.initializeRouteSubscription(
      this.route,
      ['eventId', 'speakerId'],
      (params) => this.loadSpeakerData(params)
    );
  }

  private async loadSpeakerData(params: Record<string, string>): Promise<void> {
    this.speakerId = params['speakerId'];
    const eventId = params['eventId'];

    return new Promise((resolve, reject) => {
      this.speakerService.getSpeakerById(eventId, this.speakerId)
        .pipe(takeUntilDestroyed(this.detailService['destroyRef']))
        .subscribe({
          next: (speaker: Speaker) => {
            this.speaker = speaker;
            resolve();
          },
          error: (err) => {
            this.detailService.updateState({
              error: 'Failed to load speaker data. Please check if the speaker exists.'
            });
            reject(err);
          }
        });
    });
  }

  getParsedSocialLinks(): SocialLinkInfo[] {
    if (!this.speaker?.socialLinks || this.speaker.socialLinks.length === 0) {
      return [];
    }

    return this.speaker.socialLinks.map(link =>
      this.socialLinkService.parseSocialLink(link)
    );
  }

  onImageError = (event: Event): void => {
    this.detailService.handleImageError(event);
  };
}
