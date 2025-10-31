import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Category, Format, SessionImportData } from '../../../type/session/session';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../services/sessions/session.service';
import { NavbarSessionPageComponent } from '../../../components/session/navbar-session-page/navbar-session-page.component';
import { isDefined } from '../../../../../shared/type/predicates';
import { BaseDetailService, DetailState } from '../../../components/services/base-detail.service';
import { AsyncPipe } from '@angular/common';
import { ButtonComponent } from '../../../../../shared/button/button.component';
import {SessionSpeakersComponent} from '../../../components/session/session-speakers/session-speakers.component';
import {
  SessionScheduleFormComponent
} from '../../../components/session/session-schedule-form/session-schedule-form.component';
import {SessionScheduleFormService} from '../../../services/sessions/session-schedule-form.service';
import {SessionFormatterService} from '../../../services/sessions/session-formatter.service';

@Component({
  selector: 'app-session-detail-page',
  standalone: true,
  imports: [
    NavbarSessionPageComponent,
    AsyncPipe,
    ButtonComponent,
    SessionSpeakersComponent,
    SessionScheduleFormComponent
  ],
  providers: [BaseDetailService, SessionScheduleFormService],
  templateUrl: './session-detail-page.component.html',
  styleUrl: './session-detail-page.component.scss'
})
export class SessionDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  readonly detailService = inject(BaseDetailService);
  readonly scheduleFormService = inject(SessionScheduleFormService);
  readonly formatter = inject(SessionFormatterService);

  readonly sessionId = signal<string>('');
  readonly session = signal<SessionImportData | null>(null);
  readonly format = signal<Format | null>(null);
  readonly category = signal<Category | null>(null);
  readonly availableTracks = signal<string[]>([]);

  readonly hasSessionData = computed(() => !!this.session());
  readonly canEditSchedule = computed(() =>
    this.hasSessionData() && !this.scheduleFormService.isUpdating()
  );
  readonly hasScheduleInfo = computed(() => {
    const sessionData = this.session();
    return isDefined(sessionData?.start || sessionData?.track);
  });

  readonly formattedCompleteSessionInfo = computed(() => {
    const sessionData = this.session();
    if (!sessionData) return '';
    return this.formatter.formatCompleteSessionInfo(sessionData.start, sessionData.track);
  });

  readonly state$: Observable<DetailState> = this.detailService.state$;

  ngOnInit(): void {
    this.initializeRouteSubscription();
  }

  private initializeRouteSubscription(): void {
    this.detailService.initializeRouteSubscription(
      this.route,
      ['eventId', 'sessionId'],
      (params) => this.loadSessionData(params)
    );
  }

  private async loadSessionData(params: Record<string, string>): Promise<void> {
    const sessionId = params['sessionId'];
    const eventId = params['eventId'];

    this.sessionId.set(sessionId);

    try {
      const [session, tracks] = await Promise.all([
        this.sessionService.getSessionById(eventId, sessionId).toPromise(),
        this.sessionService.getAvailableTracksForEvent(eventId).toPromise()
      ]);

      this.session.set(session!);
      this.availableTracks.set(tracks || []);
      this.format.set(session!.formats?.[0] || null);
      this.category.set(session!.categories?.[0] || null);
    } catch (error) {
      this.detailService.updateState({ error: 'Failed to load session data' });
      throw error;
    }
  }

  onImageError(event: Event): void {
    this.detailService.handleImageError(event);
  }

  onEditSession(): void {
    if (!this.canEditSchedule()) return;

    const sessionData = this.session();
    if (sessionData) {
      this.scheduleFormService.startEditing(sessionData);
    }
  }

  onSaveSchedule(): void {
    const currentState = this.detailService.getCurrentState();

    this.scheduleFormService.saveSchedule(
      currentState.eventId,
      this.sessionId(),
      (updatedSession) => this.session.set(updatedSession)
    );
  }

  onCancelScheduleEdit(): void {
    this.scheduleFormService.cancelEditing();
  }

  onSpeakerClick(speakerId: string): void {
    const currentState = this.detailService.getCurrentState();
    this.router.navigate(['event', currentState.eventId, 'speaker', speakerId]);
  }
}
