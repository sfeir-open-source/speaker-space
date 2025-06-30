import {Component} from '@angular/core';
import {Category, Format, SessionImportData} from '../../../type/session/session';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {takeUntil} from 'rxjs';
import {ActivatedRoute } from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {SessionService} from '../../../services/sessions/session.service';
import {
  NavbarSessionPageComponent
} from '../../../components/session/navbar-session-page/navbar-session-page.component';
import {BaseDetailComponent} from '../../../components/class/bade-detail-component';

@Component({
    selector: 'app-session-detail-page',
  imports: [
    ButtonGreyComponent,
    NavbarSessionPageComponent
  ],
    templateUrl: './session-detail-page.component.html',
    styleUrl: './session-detail-page.component.scss'
})
export class SessionDetailPageComponent extends BaseDetailComponent {
  sessionId: string = '';
  session: SessionImportData | null = null;
  format: Format | null = null;
  category: Category | null = null;

  constructor(
    route: ActivatedRoute,
    eventService: EventService,
    private sessionService: SessionService
  ) {
    super(route, eventService);
  }

  protected subscribeToRouteParams(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.eventId = params.get('eventId') || '';
      this.sessionId = params.get('sessionId') || '';

      if (this.eventId && this.sessionId) {
        this.loadEventAndDetailData();
      } else {
        this.error = 'Event ID or Session ID is missing from route parameters';
        this.isLoading = false;
      }
    });
  }

  protected loadDetailData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sessionService.getSessionById(this.eventId, this.sessionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (session: SessionImportData) => {
            this.session = session;
            this.format = session.formats?.[0] || null;
            this.category = session.categories?.[0] || null;
            resolve();
          },
          error: (err) => {
            console.error('Error loading session:', err);
            this.error = 'Failed to load session data';
            reject(err);
          }
        });
    });
  }

  hasScheduleInfo(): boolean {
    return !!(this.session?.start || this.session?.track);
  }

  formatCompleteSessionInfo(): string {
    if (!this.session) return '';

    const parts: string[] = [];

    if (this.session.start) {
      try {
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        };

        const dateStr = this.session.start.toLocaleDateString('en-US', options);
        const timeStr : string = this.session.start.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        parts.push(`<strong class="font-medium"> ${dateStr} </strong> at <strong class="font-medium">${timeStr}</strong>`);
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }

    if (this.session.track) {
      parts.push(`in room <strong class="font-medium">${this.getTrackName()}</strong>`);
    }

    return parts.join(' ');
  }

  getTrackName(): string {
    if (!this.session?.track) return '';

    if (this.session.track.includes(' ')) {
      return this.session.track;
    }

    return this.session.track
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  formatLevel(level: string): string {
    if (!level) return '';
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  }

  formatLanguage(languageCode: string): string {
    if (!languageCode) return '';

    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
      const languageName: string | undefined = displayNames.of(languageCode.toLowerCase());

      return languageName ?
        languageName.charAt(0).toUpperCase() + languageName.slice(1) :
        languageCode.toUpperCase();

    } catch (error) {
      console.warn(`Unable to format language code: ${languageCode}`, error);
      return languageCode.toUpperCase();
    }
  }

  onEditSession(): void {
    // TODO
  }
}
