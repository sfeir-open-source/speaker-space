import {Component, OnDestroy, OnInit } from '@angular/core';
import {Category, Format, SessionImportData} from '../../../type/session/session';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {NavbarEventPageComponent} from "../../../components/event/navbar-event-page/navbar-event-page.component";
import {Subject, Subscription, takeUntil} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {SessionService} from '../../../services/sessions/session.service';

@Component({
    selector: 'app-session-detail-page',
    imports: [
        ButtonGreyComponent,
        NavbarEventPageComponent
    ],
    templateUrl: './session-detail-page.component.html',
    styleUrl: './session-detail-page.component.scss'
})
export class SessionDetailPageComponent implements OnInit, OnDestroy {
  eventId: string = '';
  sessionId: string = '';
  eventUrl: string = '';
  eventName: string = '';
  teamId: string = '';
  session: SessionImportData | null = null;
  format: Format | null = null;
  category: Category | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();
  private routeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private sessionService: SessionService
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
      this.sessionId = params.get('sessionId') || '';

      if (this.eventId && this.sessionId) {
        this.loadEventAndSessionData();
      } else {
        this.error = 'Event ID or Session ID is missing from route parameters';
        this.isLoading = false;
      }
    });
  }

  private loadEventAndSessionData(): void {
    this.isLoading = true;

    Promise.all([
      this.loadEventData(),
      this.loadSessionData()
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

  private loadSessionData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sessionService.getSessionById(this.eventId, this.sessionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (session: SessionImportData) => {
            console.log('Session loaded:', session);
            this.session = session;

            this.format = session.formats && session.formats.length > 0
              ? session.formats[0]
              : null;

            this.category = session.categories && session.categories.length > 0
              ? session.categories[0]
              : null;

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

  private readonly languageMap: Record<string, string> = {
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish'
  };

  formatLevel(level: string): string {
    if (!level) return '';
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  }

  formatLanguage(languageCode: string): string {
    if (!languageCode) return '';
    const code: string = languageCode.toLowerCase();
    return this.languageMap[code] || languageCode;
  }

  goBackToSessionList(): void {
    this.router.navigate(['/event-sessions', this.eventId]);
  }

  onEditSession(): void {

  }
}
