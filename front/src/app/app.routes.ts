import { Routes } from '@angular/router';
import {TestConnectionBackFrontComponent} from './common/test-connection-back-front/test-connection-back-front.component';
import {NotFoundPageComponent} from './features/not-found-page/not-found-page.component';
import {LoginComponent} from './features/login/login.component';
import {HomePageComponent} from "./features/home-page/home-page.component";

export const routes: Routes = [
  { path:'', component: HomePageComponent},
  { path: 'testco', component: TestConnectionBackFrontComponent },
  { path: 'login', component: LoginComponent },
  { path: 'not-found', component: NotFoundPageComponent },
  { path: '**', redirectTo: '/not-found' }
];
