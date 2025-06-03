import { Routes } from '@angular/router';
import {TestConnectionBackFrontComponent} from './core/test-connection-back-front/test-connection-back-front.component';
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
import {SessionPageComponent} from './feature/admin-management/pages/events/session-page/session-page.component';

export const routes: Routes = [
  { path:'', component: HomePageComponent},
  { path: 'system-info', component: TestConnectionBackFrontComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginPageComponent },
  { path: 'create-team', component: CreateTeamPageComponent},
  { path: 'team/:teamId', component: ListEventPageComponent},
  { path: 'create-event', component: CreateEventPageComponent },
  { path: 'create-event/:teamId', component: CreateEventPageComponent },
  { path: 'settings-general/:teamId', component: SettingTeamGeneralPageComponent},
  { path: 'settings-members/:teamId', component: SettingTeamMembersPageComponent },
  { path: 'event-detail/:eventId', component: SettingEventPageComponent },
  { path: 'event-customize/:eventId', component: CustomizeEventComponent },
  { path: 'session/:eventId', component: SessionPageComponent },
  { path: 'profile', component: ProfileComponent},
  { path: 'not-found', component: NotFoundPageComponent },
  { path: '**', redirectTo: '/not-found' }
];
