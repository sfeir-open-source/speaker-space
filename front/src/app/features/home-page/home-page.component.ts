import { Component } from '@angular/core';
import {IsLogoutHomePageComponent} from '../../common/components/home-page/is-logout-home-page/is-logout-home-page-component';
import {IsLoginHomePageComponent} from '../../common/components/home-page/is-login-home-page/is-login-home-page.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [IsLoginHomePageComponent, IsLogoutHomePageComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  isLogin = false;

}
