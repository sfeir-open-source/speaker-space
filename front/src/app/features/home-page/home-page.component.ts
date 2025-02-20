import { Component } from '@angular/core';
import {LogoutHomePageComponent} from '../../common/components/home-page/logout-home-page/logout-home-page-component';
import {LoginHomePageComponent} from '../../common/components/home-page/login-home-page/login-home-page.component';

@Component({
  selector: 'app-home-page',
  imports: [LogoutHomePageComponent, LoginHomePageComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  isLogin = true;

}
