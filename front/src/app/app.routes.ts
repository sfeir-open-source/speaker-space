import { Routes } from '@angular/router';
import {TestConnectionBackFrontComponent} from './common/test-connection-back-front/test-connection-back-front.component';
import {HomePageComponent} from './features/home-page/home-page.component';
import {NotFoundPageComponent} from './features/not-found-page/not-found-page.component';

export const routes: Routes = [
  { path:'', component: HomePageComponent},
  { path: 'testco', component: TestConnectionBackFrontComponent },
  { path: '**', component: NotFoundPageComponent },
];
