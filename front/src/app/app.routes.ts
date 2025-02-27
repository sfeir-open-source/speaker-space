import { Routes } from '@angular/router';
import {TestConnectionBackFrontComponent} from './common/test-connection-back-front/test-connection-back-front.component';
import {NotFoundPageComponent} from './features/not-found-page/not-found-page.component';
import {LoginComponent} from './features/login-page/login.component';
import {LogoutHomePageComponent} from './common/components/home-page/logout-home-page/logout-home-page-component';

export const routes: Routes = [
  { path:'', component: LogoutHomePageComponent},
  { path: 'system-info', component: TestConnectionBackFrontComponent },
  { path: 'login', component: LoginComponent },
  { path: 'not-found', component: NotFoundPageComponent },
  { path: '**', redirectTo: '/not-found' }
];
