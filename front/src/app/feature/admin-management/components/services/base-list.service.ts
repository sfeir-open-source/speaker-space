import { Injectable, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventDTO } from '../../type/event/eventDTO';
import { EventService } from '../../services/event/event.service';
import { EventDataService } from '../../services/event/event-data.service';
import { PaginationService } from './pagination.service';
import {ListState} from '../type/liste-state';

@Injectable()
export class BaseListService<T> {
  private readonly _state$ = new BehaviorSubject<ListState>({
    eventId: '',
    eventUrl: '',
    eventName: '',
    teamId: '',
    teamUrl: '',
    event: null,
    isLoading: true,
    error: null,
    isLoadingItems: false,
    searchTerm: '',
    selectedItems: [],
    selectAll: false,
    currentUserRole: 'Owner'
  });

  public readonly state$: Observable<ListState> = this._state$.asObservable();

  readonly paginationService = new PaginationService<T>();
  private readonly _items$ = new BehaviorSubject<T[]>([]);
  private readonly _filteredItems$ = new BehaviorSubject<T[]>([]);
  private routeSubscription?: any;
  private readonly destroyRef = inject(DestroyRef);
  protected destroy$ = new Subject<void>();

  constructor(
    private eventService: EventService,
    private eventDataService: EventDataService
  ) {
    this.destroy$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  initializeRouteSubscription(
    route: ActivatedRoute,
    itemsLoader: () => Promise<void> | void
  ): void {
    this.routeSubscription = route.paramMap.subscribe(params => {
      const eventId = params.get('eventId') || '';

      if (eventId) {
        this.updateState({ eventId, isLoading: true, error: null });
        this.loadEventAndItems(eventId, itemsLoader);
      } else {
        this.updateState({
          error: 'Event ID is missing from route parameters',
          isLoading: false
        });
      }
    });
  }

  private async loadEventAndItems(
    eventId: string,
    itemsLoader: () => Promise<void> | void
  ): Promise<void> {
    try {
      await Promise.all([
        this.loadEventData(eventId),
        Promise.resolve(itemsLoader())
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      this.updateState({ error: 'Failed to load data' });
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  private loadEventData(eventId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventService.getEventById(eventId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (event: EventDTO) => {
            this.handleEventDataLoaded(event);
            this.eventDataService.loadEvent({
              idEvent: event.idEvent || eventId,
              eventName: event.eventName || '',
              teamId: event.teamId || '',
              url: event.url || '',
              teamUrl: event.teamUrl,
              type: event.type,
            });
            resolve();
          },
          error: (err) => {
            this.updateState({ error: 'Failed to load event data. Please try again.' });
            reject(err);
          }
        });
    });
  }

  private handleEventDataLoaded(event: EventDTO): void {
    this.updateState({
      eventId: event.idEvent || this.getCurrentState().eventId,
      eventName: event.eventName || '',
      eventUrl: event.url || '',
      teamUrl: event.teamUrl || '',
      teamId: event.teamId || '',
      error: null
    });
  }

  updateItems(items: T[]): void {
    this._items$.next(items);
    this._filteredItems$.next([...items]);

    this.paginationService.setItems(items);
  }

  updateFilteredItems(filteredItems: T[]): void {
    this._filteredItems$.next(filteredItems);
    this.paginationService.updateFilteredItems(filteredItems);

    this.updateState({
      selectedItems: [],
      selectAll: false
    });
  }

  onSearch(searchTerm: string): void {
    this.updateState({ searchTerm: searchTerm.toLowerCase() });
  }

  toggleItemSelection(itemId: string): void {
    const state = this.getCurrentState();
    const selectedItems = [...state.selectedItems];
    const index = selectedItems.indexOf(itemId);

    if (index > -1) {
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(itemId);
    }

    this.updateState({ selectedItems });
    this.updateSelectAllState();
  }

  toggleSelectAll(getItemId: (item: T) => string): void {
    const state = this.getCurrentState();
    const paginatedItems = this.paginationService.getPaginatedItems();

    if (state.selectAll) {
      this.updateState({ selectedItems: [], selectAll: false });
    } else {
      const selectedItems = paginatedItems
        .map(item => getItemId(item))
        .filter(id => id !== '');
      this.updateState({ selectedItems, selectAll: true });
    }
  }

  private updateSelectAllState(): void {
    const state = this.getCurrentState();

    const paginatedItems = this.paginationService.getPaginatedItems();

    const selectAll = state.selectedItems.length > 0 &&
      paginatedItems.length > 0;
    this.updateState({ selectAll });
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/profil-picture.svg';
  }

  updateState(partialState: Partial<ListState>): void {
    const currentState = this._state$.value;
    const newState = { ...currentState, ...partialState };
    this._state$.next(newState);
  }

  getCurrentState(): ListState {
    return this._state$.value;
  }

  getCurrentItems(): T[] {
    return this._items$.value;
  }

  getCurrentFilteredItems(): T[] {
    return this._filteredItems$.value;
  }

  destroy(): void {
    this.routeSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    this._state$.complete();
    this._items$.complete();
    this._filteredItems$.complete();
    this.paginationService.reset();
  }
}
