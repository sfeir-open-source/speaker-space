import { Routes } from '@angular/router';
import {NotFoundPageComponent} from './core/not-found-page/not-found-page.component';
import {HomePageComponent} from './core/home-page/home-page.component';
import {LoginPageComponent} from './core/login/login-page/login-page.component';
import {AuthGuard} from '@angular/fire/auth-guard';
import {ProfileComponent} from './feature/profile/profile.component';
import {
  CreateTeamPageComponent
} from './feature/admin-management/pages/team/create-team-page/create-team-page.component';
import {
  SettingTeamGeneralPageComponent
} from './feature/admin-management/pages/team/setting-team-general-page/setting-team-general-page.component';
import {
  SettingTeamMembersPageComponent
} from './feature/admin-management/pages/team/setting-team-members-page/setting-team-members-page.component';
import {
  SettingEventPageComponent
} from './feature/admin-management/pages/events/setting-event-page/setting-event-page.component';
import {
  CustomizeEventComponent
} from './feature/admin-management/pages/events/customize-event/customize-event.component';
import {
  CreateEventPageComponent
} from './feature/admin-management/pages/events/create-event-page/create-event-page.component';
import {ListEventPageComponent} from './feature/admin-management/pages/team/list-event-page/list-event-page.component';
import {
  SpeakerListPageComponent
} from './feature/admin-management/pages/speaker/speaker-list-page/speaker-list-page.component';
import {
  CalendarEventPageComponent
} from './feature/admin-management/pages/calendar/calendar-event-page/calendar-event-page.component';
import {
  SessionListUnifiedComponent
} from './feature/admin-management/components/session/session-list-unified/session-list-unified.component';
import {
  SpeakerProfileUnifiedComponent
} from './feature/admin-management/components/speaker/speaker-profile-unified/speaker-profile-unified.component';
import {
  SessionDetailUnifiedComponent
} from './feature/admin-management/components/session/session-detail-unified/session-detail-unified.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'create-team', component: CreateTeamPageComponent, canActivate: [AuthGuard]},
  { path: 'team/:teamId', component: ListEventPageComponent, canActivate: [AuthGuard]},
  { path: 'create-event', component: CreateEventPageComponent, canActivate: [AuthGuard] },
  { path: 'create-event/:teamId', component: CreateEventPageComponent, canActivate: [AuthGuard] },
  { path: 'settings-general/:teamId', component: SettingTeamGeneralPageComponent, canActivate: [AuthGuard]},
  { path: 'settings-members/:teamId', component: SettingTeamMembersPageComponent, canActivate: [AuthGuard] },
  { path: 'event-detail/:eventId', component: SettingEventPageComponent, canActivate: [AuthGuard] },
  { path: 'event-customize/:eventId', component: CustomizeEventComponent, canActivate: [AuthGuard] },
  { path: 'event-calendar/:eventId', component: CalendarEventPageComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'event-speakers/:eventId', component: SpeakerListPageComponent, canActivate: [AuthGuard] },
  { path: 'event-sessions/:eventId', component: SessionListUnifiedComponent, canActivate: [AuthGuard] },
  { path: 'event/:eventId/sessions', component: SessionListUnifiedComponent, canActivate: [AuthGuard] },
  { path: 'event/:eventId/speaker/:speakerId', component: SpeakerProfileUnifiedComponent, canActivate: [AuthGuard] },
  { path: 'event/:eventId/session/:sessionId', component: SessionDetailUnifiedComponent, canActivate: [AuthGuard] },
  { path: 'speaker/event/:eventId/session/:sessionId', redirectTo: 'event/:eventId/session/:sessionId' },
  { path: 'event/:eventId/my-profile', component: SpeakerProfileUnifiedComponent, canActivate: [AuthGuard] },
  { path: 'speaker/event/:eventId/sessions', redirectTo: 'event/:eventId/sessions' },
  { path: 'speaker/event/:eventId/session/:sessionId', redirectTo: 'event/:eventId/session/:sessionId' },
  { path: 'not-found', component: NotFoundPageComponent },
  { path: '**', redirectTo: '/not-found' }
];
