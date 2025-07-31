import {Component, inject, Input, OnInit} from '@angular/core';
import {BaseListComponent} from '../../../admin-management/components/class/base-list-component';
import {Category, Format, SessionImportData} from '../../../admin-management/type/session/session';
import {SessionFilters} from '../../../admin-management/type/session/session-filters';
import {SessionService} from '../../../admin-management/services/sessions/session.service';
import {UserContextService} from '../../../../core/services/user-services/user-context.service';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../../admin-management/services/event/event.service';
import {SpeakerService} from '../../../admin-management/services/speaker/speaker.service';
import {EventDataService} from '../../../admin-management/services/event/event-data.service';
import {UserRoleService} from '../../../../core/services/user-services/user-role.service';
import {finalize} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {NavbarSpeakerSectionComponent} from '../../components/navbar-speaker-section/navbar-speaker-section.component';

@Component({
  selector: 'app-speaker-session-list-page',
  imports: [
    FormsModule,
    NavbarSpeakerSectionComponent,
  ],
  templateUrl: './speaker-session-list-page.component.html',
  styleUrl: './speaker-session-list-page.component.scss'
})
export class SpeakerSessionListPageComponent extends BaseListComponent<SessionImportData> implements OnInit {
  @Input() icon: string = 'search';

  userRole: 'admin' | 'speaker' = 'speaker';
  availableFormats: Format[] = [];
  availableCategories: Category[] = [];
  availableTracks: string[] = [];
  eventStartDate?: Date;
  eventEndDate?: Date;
  currentFilters: SessionFilters = {
    selectedFormats: [],
    selectedCategories: []
  };

  private sessionService : SessionService = inject(SessionService);
  private userRoleService : UserRoleService = inject(UserRoleService);
  private userContextService : UserContextService = inject(UserContextService);

  get totalSessions(): number {
    return this.totalItems;
  }

  get isLoadingSessions(): boolean {
    return this.isLoadingItems;
  }

  get paginatedSessions(): SessionImportData[] {
    return this.paginatedItems;
  }

  Math = Math;

  constructor(
    route: ActivatedRoute,
    router: Router,
    eventService: EventService,
    speakerService: SpeakerService,
    eventDataService: EventDataService
  ) {
    super(route, router, eventService, speakerService, eventDataService);
  }

  override async ngOnInit(): Promise<void> {
    await this.determineUserRole();

    super.ngOnInit();

    this.loadAvailableTracks();
    this.loadEventDates();
  }

  private async determineUserRole(): Promise<void> {
    try {
      const eventId : string = this.route.snapshot.paramMap.get('eventId') || '';
      if (eventId) {
        this.userRole = await this.userRoleService.getUserRoleForEvent(eventId);
      }
    } catch (error) {
      console.warn('Error determining user role, defaulting to speaker:', error);
      this.userRole = 'speaker';
    }
  }

  loadItems(): void {
    if (!this.eventId) return;

    this.isLoadingItems = true;

    const sessionObservable = this.userRole === 'speaker'
      ? this.userContextService.getSessionsForCurrentUser(this.eventId)
      : this.eventService.getSessionsByEventId(this.eventId);

    sessionObservable
      .pipe(
        finalize(() => this.isLoadingItems = false),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe({
        next: (sessions: SessionImportData[]) => {

          const sortedSessions: SessionImportData[] = sessions.sort((a, b) => {
            const titleA: string = a.title?.toLowerCase() || '';
            const titleB: string = b.title?.toLowerCase() || '';
            return titleA.localeCompare(titleB);
          });

          this.items = sortedSessions;
          this.filteredItems = [...sortedSessions];
          this.totalItems = sortedSessions.length;

          this.extractAvailableFilters(sessions);
          this.calculatePagination();
        },
        error: (error) => {
          const errorMessage = this.userRole === 'speaker'
            ? 'Failed to load your sessions. Please try again.'
            : 'Failed to load sessions. Please try again.';

          this.error = errorMessage;
          this.items = [];
          this.filteredItems = [];
          this.totalItems = 0;
        }
      });
  }

  override onRowClick(session: SessionImportData, event: Event): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON') {
      return;
    }

    if (session.id) {
      this.openItemDetail(session.id);
    }
  }

  private loadEventDates(): void {
    if (!this.eventId) return;

    this.eventService.getEventById(this.eventId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (event) => {
          if (event.startDate) {
            this.eventStartDate = new Date(event.startDate);
          }
          if (event.endDate) {
            this.eventEndDate = new Date(event.endDate);
          }
        },
        error: (error) => {
          console.warn('Failed to load event dates:', error);
        }
      });
  }

  private loadAvailableTracks(): void {
    if (!this.eventId) return;

    this.sessionService.getAvailableTracksForEvent(this.eventId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (tracks) => {
          this.availableTracks = tracks || [];
        },
        error: (error) => {
          console.warn('Failed to load available tracks:', error);
          this.availableTracks = [];
        }
      });
  }

  getItemId(session: SessionImportData): string {
    return session.id || '';
  }

  openItemDetail(sessionId: string): void {
    if (sessionId) {
      if (this.userRole === 'speaker') {
        this.router.navigate(['/speaker/event', this.eventId, 'session', sessionId]);
      } else {
        this.router.navigate(['/event', this.eventId, 'session', sessionId]);
      }
    }
  }

  private extractAvailableFilters(sessions: SessionImportData[]): void {
    const formatMap = new Map<string, Format>();
    sessions.forEach(session => {
      session.formats?.forEach(format => {
        if (format.id && !formatMap.has(format.id)) {
          formatMap.set(format.id, format);
        }
      });
    });
    this.availableFormats = Array.from(formatMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    const categoryMap = new Map<string, Category>();
    sessions.forEach(session => {
      session.categories?.forEach(category => {
        if (category.id && !categoryMap.has(category.id)) {
          categoryMap.set(category.id, category);
        }
      });
    });
    this.availableCategories = Array.from(categoryMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private applyFilters(): void {
    let filtered: SessionImportData[] = [...this.items];

    if (this.currentFilters.selectedFormats.length > 0) {
      filtered = filtered.filter(session =>
        session.formats?.some(format =>
          this.currentFilters.selectedFormats.includes(format.id)
        )
      );
    }

    if (this.currentFilters.selectedCategories.length > 0) {
      filtered = filtered.filter(session =>
        session.categories?.some(category =>
          this.currentFilters.selectedCategories.includes(category.id)
        )
      );
    }

    if (this.searchTerm.trim()) {
      const searchLower: string = this.searchTerm.toLowerCase();
      filtered = filtered.filter(session =>
        session.title?.toLowerCase().includes(searchLower) ||
        session.abstractText?.toLowerCase().includes(searchLower) ||
        session.speakers?.some(speaker =>
          speaker.name?.toLowerCase().includes(searchLower)
        )
      );
    }

    this.filteredItems = filtered;
    this.updateItemsAfterFilter();
  }

  filterItems(): void {
    this.applyFilters();
  }
}
