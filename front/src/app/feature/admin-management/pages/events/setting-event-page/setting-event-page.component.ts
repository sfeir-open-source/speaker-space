import { Component, OnInit, inject, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarEventPageComponent } from '../../../components/event/navbar-event-page/navbar-event-page.component';
import { SidebarEventComponent } from '../../../components/event/sidebar-event/sidebar-event.component';
import { DangerZoneComponent } from '../../../components/danger-zone/danger-zone.component';
import { ArchiveEventPopupComponent } from '../../../components/event/archive-event-popup/archive-event-popup.component';
import { DeleteConfirmationPopupComponent } from '../../../components/delete-confirmation-popup/delete-confirmation-popup.component';
import { SessionReviewImportComponent } from '../../../components/session/session-review-import/session-review-import.component';
import { SessionScheduleImportComponent } from '../../../components/session/session-schedule-import/session-schedule-import.component';
import { EventSettingsSectionsComponent } from '../../../components/event/event-settings-sections/event-settings-sections.component';
import { EventSettingsService } from '../../../services/event/event-settings.service';
import { EventDangerActionsService } from '../../../services/event/event-danger-actions.service';

@Component({
  selector: 'app-setting-event-page',
  standalone: true,
  imports: [
    NavbarEventPageComponent,
    SidebarEventComponent,
    DangerZoneComponent,
    ArchiveEventPopupComponent,
    DeleteConfirmationPopupComponent,
    SessionReviewImportComponent,
    SessionScheduleImportComponent,
    EventSettingsSectionsComponent
  ],
  providers: [EventSettingsService, EventDangerActionsService],
  templateUrl: './setting-event-page.component.html'
})
export class SettingEventPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly settingsService = inject(EventSettingsService);
  readonly dangerActionsService = inject(EventDangerActionsService);

  readonly canShowDangerZone = computed(() =>
    this.settingsService.currentUserRole() === 'Owner'
  );

  readonly dangerZoneConfig = computed(() =>
    this.dangerActionsService.getDangerZoneConfig(
      this.settingsService.eventName(),
      this.settingsService.currentUserRole()
    )
  );

  readonly deleteConfirmationConfig = computed(() =>
    this.dangerActionsService.getDeleteConfirmationConfig(
      this.settingsService.eventName()
    )
  );

  ngOnInit(): void {
    this.subscribeToRouteParams(); }

  private subscribeToRouteParams(): void {
    this.route.paramMap.subscribe(params => {
      const eventId = params.get('eventId');

      if (eventId) {
        this.settingsService.loadEventData(eventId);
      } else {
        this.settingsService.error.set('Event ID is missing from route parameters');
        this.settingsService.isLoading.set(false);
      }
    });
  }

  onDangerZoneArchive(): void {
    this.dangerActionsService.confirmArchive();
  }

  onDangerZoneDelete(): void {
    this.dangerActionsService.confirmDelete();
  }

  onArchiveConfirmed(): void {
    this.dangerActionsService.archiveEvent(this.settingsService.eventId());
  }

  onArchiveCancelled(): void {
    this.dangerActionsService.cancelArchive();
  }

  onDeleteConfirmed(): void {
    this.dangerActionsService.deleteEvent(this.settingsService.eventId());
  }

  onDeleteCancelled(): void {
    this.dangerActionsService.cancelDelete();
  }
}
