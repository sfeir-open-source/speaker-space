import { Routes } from '@angular/router';
import {TestConnectionBackFrontComponent} from './common/test-connection-back-front/test-connection-back-front.component';
import {NotFoundPageComponent} from './features/not-found-page/not-found-page.component';
import {HomePageComponent} from './features/home-page/home-page.component';
import {LoginPageComponent} from './features/login-page/login-page.component';

export const routes: Routes = [
  { path:'', component: HomePageComponent},
  { path: 'system-info', component: TestConnectionBackFrontComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'not-found', component: NotFoundPageComponent },
  { path: '**', redirectTo: '/not-found' }
];
