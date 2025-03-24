import { Routes } from '@angular/router';
import {TestConnectionBackFrontComponent} from './core/test-connection-back-front/test-connection-back-front.component';
import {NotFoundPageComponent} from './core/not-found-page/not-found-page.component';
import {HomePageComponent} from './core/home-page/home-page.component';
import {LoginPageComponent} from './core/login/login-page/login-page.component';
import {AuthGuard} from '@angular/fire/auth-guard';
import {CreateTeamPageComponent} from './feature/admin-management/create-team-page/create-team-page.component';
import {TeamPageComponent} from './feature/admin-management/team-page/team-page.component';
import {SettingTeamPageComponent} from './feature/admin-management/setting-team-page/setting-team-page.component';

export const routes: Routes = [
  { path:'', component: HomePageComponent},
  { path: 'system-info', component: TestConnectionBackFrontComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginPageComponent },
  { path: 'create-team', component: CreateTeamPageComponent},
  { path: 'team-page', component: TeamPageComponent},
  { path: 'team-settings', component: SettingTeamPageComponent},
  { path: 'not-found', component: NotFoundPageComponent },
  { path: '**', redirectTo: '/not-found' }
];
