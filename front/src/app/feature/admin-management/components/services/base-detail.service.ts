import { Injectable, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {EventDTO} from '../../type/event/eventDTO';
import {EventService} from '../../services/event/event.service';

export type DetailState = {
  eventId: string;
  eventUrl: string;
  eventName: string;
  teamId: string;
  event: EventDTO | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable()
export class BaseDetailService {
  private readonly _state$ = new BehaviorSubject<DetailState>({
    eventId: '',
    eventUrl: '',
    eventName: '',
    teamId: '',
    event: null,
    isLoading: true,
    error: null
  });

  public readonly state$: Observable<DetailState> = this._state$.asObservable();

  private routeSubscription?: Subscription;
  private readonly destroyRef = inject(DestroyRef);

  constructor(private eventService: EventService) {}

  initializeRouteSubscription(
    route: ActivatedRoute,
    paramNames: string[],
    detailDataLoader: (params: Record<string, string>) => Promise<void>
  ): void {
    this.routeSubscription = route.paramMap.subscribe(paramMap => {
      const params: Record<string, string> = {};

      paramNames.forEach(paramName => {
        params[paramName] = paramMap.get(paramName) || '';
      });

      const missingParams = paramNames.filter(name => !params[name]);
      if (missingParams.length > 0) {
        this.updateState({
          error: `Missing required parameters: ${missingParams.join(', ')}`,
          isLoading: false
        });
        return;
      }

      this.updateState({
        eventId: params['eventId'],
        isLoading: true,
        error: null
      });

      this.loadEventAndDetailData(params, detailDataLoader);
    });
  }

  private loadEventAndDetailData(
    params: Record<string, string>,
    detailDataLoader: (params: Record<string, string>) => Promise<void>
  ): void {
    this.updateState({ isLoading: true });

    Promise.all([
      this.loadEventData(params['eventId']),
      detailDataLoader(params)
    ])
      .catch(error => {
        console.error('Error loading data:', error);
      })
      .finally(() => {
        this.updateState({ isLoading: false });
      });
  }

  private loadEventData(eventId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventService.getEventById(eventId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (event: EventDTO) => {
            this.updateState({
              event,
              eventUrl: event.url || '',
              eventName: event.eventName || '',
              teamId: event.teamId || ''
            });
            resolve();
          },
          error: (err) => {
            this.updateState({ error: 'Failed to load event data' });
            reject(err);
          }
        });
    });
  }

  updateState(partialState: Partial<DetailState>): void {
    const currentState = this._state$.value;
    this._state$.next({ ...currentState, ...partialState });
  }

  getCurrentState(): DetailState {
    return this._state$.value;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/profil-picture.svg';
  }

  destroy(): void {
    this.routeSubscription?.unsubscribe();
    this._state$.complete();
  }
}
