import { Routes } from '@angular/router';
import {TestConnectionBackFrontComponent} from './core/test-connection-back-front/test-connection-back-front.component';
import {NotFoundPageComponent} from './core/not-found-page/not-found-page.component';
import {HomePageComponent} from './core/home-page/home-page.component';
import {LoginPageComponent} from './core/login/login-page/login-page.component';
import {AuthGuard} from '@angular/fire/auth-guard';
import {ProfileComponent} from './feature/profile/profile.component';
import {EventListPageComponent} from './feature/admin-management/events/event-list-page/event-list-page.component';
import {CreateTeamPageComponent} from './feature/admin-management/team/create-team-page/create-team-page.component';
import {CreateEventPageComponent} from './feature/admin-management/events/create-event/create-event-page/create-event-page.component';
import {
  SettingTeamGeneralPageComponent
} from './feature/admin-management/team/setting-team-general-page/setting-team-general-page.component';
import {
  SettingTeamMembersPageComponent
} from './feature/admin-management/team/setting-team-members-page/setting-team-members-page.component';
import {
  EventDetailPageComponent
} from './feature/admin-management/events/event-detail-page/event-detail-page.component';

export const routes: Routes = [
  { path:'', component: HomePageComponent},
  { path: 'system-info', component: TestConnectionBackFrontComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginPageComponent },
  { path: 'create-team', component: CreateTeamPageComponent},
  { path: 'team/:teamUrl', component: EventListPageComponent},
  { path: 'create-event', component: CreateEventPageComponent },
  { path: 'create-event/:teamId', component: CreateEventPageComponent },
  { path: 'settings-general/:teamUrl', component: SettingTeamGeneralPageComponent},
  { path: 'settings-members/:teamUrl', component: SettingTeamMembersPageComponent },
  { path: 'event-detail', component: EventDetailPageComponent },
  { path: 'profile', component: ProfileComponent},
  { path: 'not-found', component: NotFoundPageComponent },
  { path: '**', redirectTo: '/not-found' }
];
