import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SafeHtml } from '@angular/platform-browser';
import { Speaker } from '../../../type/session/session';
import { NavbarSpeakerPageComponent } from '../../../components/speaker/navbar-speaker-page/navbar-speaker-page.component';
import { SpeakerService } from '../../../services/speaker/speaker.service';
import { SocialLinkService } from '../../../../../core/services/social-link-service/social-link.service';
import { SocialLinkInfo } from '../../../../../core/types/social-link-info';
import { BaseDetailService, DetailState } from '../../../components/services/base-detail.service';

interface SocialLinkWithIcon extends SocialLinkInfo {
  iconContent: SafeHtml;
}

@Component({
  selector: 'app-speaker-detail-page',
  imports: [
    NavbarSpeakerPageComponent,
    AsyncPipe,
    HttpClientModule
  ],
  providers: [BaseDetailService],
  templateUrl: './speaker-detail-page.component.html',
  styleUrl: './speaker-detail-page.component.scss'
})
export class SpeakerDetailPageComponent implements OnInit, OnDestroy {
  speakerId: string = '';
  speaker: Speaker | null = null;

  readonly socialLinksWithIcons = signal<SocialLinkWithIcon[]>([]);

  readonly detailService = inject(BaseDetailService);
  readonly route = inject(ActivatedRoute);
  readonly speakerService = inject(SpeakerService);
  readonly socialLinkService = inject(SocialLinkService);

  readonly state$: Observable<DetailState> = this.detailService.state$;

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

    return new Promise<void>((resolve, reject) => {
      this.speakerService.getSpeakerById(eventId, this.speakerId)
        .pipe(takeUntilDestroyed(this.detailService['destroyRef']))
        .subscribe({
          next: (speaker: Speaker) => {
            this.speaker = speaker;
            this.loadSocialLinksWithIcons();
            resolve();
          },
          error: (err: Error) => {
            this.detailService.updateState({
              error: 'Failed to load speaker data. Please check if the speaker exists.'
            });
            reject(err);
          }
        });
    });
  }

  private loadSocialLinksWithIcons(): void {
    if (!this.speaker?.socialLinks || this.speaker.socialLinks.length === 0) {
      this.socialLinksWithIcons.set([]);
      return;
    }

    const socialLinkObservables = this.speaker.socialLinks.map(link =>
      this.socialLinkService.parseSocialLinkWithIcon(link, '16')
    );

    combineLatest(socialLinkObservables)
      .pipe(takeUntilDestroyed(this.detailService['destroyRef']))
      .subscribe(socialLinksWithIcons => {
        this.socialLinksWithIcons.set(socialLinksWithIcons);
      });
  }

  onImageError = (event: Event): void => {
    this.detailService.handleImageError(event);
  };
}
