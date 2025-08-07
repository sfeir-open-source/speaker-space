import {Component, inject, Input} from '@angular/core';
import {SessionCreatePopupComponent} from '../session-create-popup/session-create-popup.component';
import {NavbarEventPageComponent} from '../../event/navbar-event-page/navbar-event-page.component';
import {FormsModule} from '@angular/forms';
import {ButtonGreenActionsComponent} from '../../../../../shared/button-green-actions/button-green-actions.component';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';
import {SessionUnifiedFilterPopupComponent} from '../session-filter-popup/session-filter-popup.component';
import {BaseListComponent} from '../../class/base-list-component';
import {Category, Format, SessionImportData, Speaker} from '../../../type/session/session';
import {SessionFilters} from '../../../type/session/session-filters';
import {SessionService} from '../../../services/sessions/session.service';
import {UserRoleService} from '../../../../../core/services/user-services/user-role.service';
import {UserContextService} from '../../../../../core/services/user-services/user-context.service';
import {ActivatedRoute, Router} from '@angular/router';
import {EventService} from '../../../services/event/event.service';
import {SpeakerService} from '../../../services/speaker/speaker.service';
import {EventDataService} from '../../../services/event/event-data.service';
import {finalize} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  NavbarSpeakerSectionComponent
} from '../../../../speaker-section/components/navbar-speaker-section/navbar-speaker-section.component';
import {SessionFormatService} from '../../../services/sessions/session-format.service';

@Component({
  selector: 'app-session-list-unified',
  imports: [
    SessionCreatePopupComponent,
    NavbarEventPageComponent,
    NavbarSpeakerSectionComponent,
    FormsModule,
    ButtonGreenActionsComponent,
    ButtonGreyComponent,
    SessionUnifiedFilterPopupComponent
  ],
  templateUrl: './session-list-unified.component.html',
  styleUrl: './session-list-unified.component.scss'
})
export class SessionListUnifiedComponent extends BaseListComponent<SessionImportData> {
  @Input() userRole: 'admin' | 'speaker' = 'admin';

  showFilterPopup : boolean = false;
  showCreatePopup : boolean = false;
  availableFormats: Format[] = [];
  availableCategories: Category[] = [];
  availableTracks: string[] = [];
  eventStartDate?: Date;
  eventEndDate?: Date;
  currentFilters: SessionFilters = {
    selectedFormats: [],
    selectedCategories: []
  };

  private readonly sessionService = inject(SessionService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly userContextService = inject(UserContextService);
  private readonly sessionFormatService = inject(SessionFormatService);

  get totalSessions(): number { return this.totalItems; }
  get isLoadingSessions(): boolean { return this.isLoadingItems; }
  get paginatedSessions(): SessionImportData[] { return this.paginatedItems; }
  readonly Math = Math;

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

    if (this.userRole === 'admin') {
      this.loadAvailableTracks();
      this.loadEventDates();
    }
  }

  private async determineUserRole(): Promise<void> {
    try {
      const eventId : string = this.route.snapshot.paramMap.get('eventId') || '';
      if (eventId) {
        this.userRole = await this.userRoleService.getUserRoleForEvent(eventId);
      }
    } catch (error) {
      console.warn('Error determining user role, defaulting to admin:', error);
      this.userRole = 'admin';
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
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
        next: (sessions: SessionImportData[]) => {
          const sortedSessions = sessions.sort((a, b) => {
            const titleA : string = a.title?.toLowerCase() || '';
            const titleB : string = b.title?.toLowerCase() || '';
            return titleA.localeCompare(titleB);
          });

          this.items = sortedSessions;
          this.filteredItems = [...sortedSessions];
          this.totalItems = sortedSessions.length;

          if (this.userRole === 'admin') {
            this.extractAvailableFilters(sessions);
          }
          this.calculatePagination();
        },
        error: () => {
          this.error = this.userRole === 'speaker'
            ? 'Failed to load your sessions. Please try again.'
            : 'Failed to load sessions. Please try again.';
          this.items = [];
          this.filteredItems = [];
          this.totalItems = 0;
        }
      });
  }

  private loadEventDates(): void {
    if (!this.eventId) return;

    this.eventService.getEventById(this.eventId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (event) => {
          if (event.startDate) this.eventStartDate = new Date(event.startDate);
          if (event.endDate) this.eventEndDate = new Date(event.endDate);
        },
        error: (error) => console.warn('Failed to load event dates:', error)
      });
  }

  private loadAvailableTracks(): void {
    if (!this.eventId) return;

    this.sessionService.getAvailableTracksForEvent(this.eventId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (tracks) => this.availableTracks = tracks || [],
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

  formatSpeakers(speakers: Speaker[] | undefined): string {
    if (!speakers || speakers.length === 0) return 'No speaker';
    return speakers.map(speaker => speaker.name).filter(name => name).join(', ');
  }

  formatSessionScheduleInfo(session: SessionImportData): string {
    return this.sessionFormatService.formatCompleteScheduleInfo(
      session.start,
      session.track,
      {
        includeHtml: true,
        trackPrefix: 'in room'
      }
    );
  }

  openFilterPopup(): void {
    if (this.userRole === 'admin') this.showFilterPopup = true;
  }

  closeFilterPopup(): void {
    this.showFilterPopup = false;
  }

  onFiltersApplied(filters: SessionFilters): void {
    this.currentFilters = filters;
    this.applyFilters();
    this.closeFilterPopup();
  }

  onFiltersReset(): void {
    this.currentFilters = { selectedFormats: [], selectedCategories: [] };
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return this.currentFilters.selectedFormats.length > 0 ||
      this.currentFilters.selectedCategories.length > 0;
  }

  get activeFiltersCount(): number {
    return this.currentFilters.selectedFormats.length +
      this.currentFilters.selectedCategories.length;
  }

  onCreateSession(): void {
    if (this.userRole === 'admin') this.showCreatePopup = true;
  }

  onCloseCreatePopup(): void {
    this.showCreatePopup = false;
  }

  onSessionCreated(): void {
    this.showCreatePopup = false;
    this.loadItems();
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
    let filtered = [...this.items];

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
      const searchLower = this.searchTerm.toLowerCase();
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
