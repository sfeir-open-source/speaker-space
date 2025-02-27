import { Component } from '@angular/core';
import {environment} from '../../../environments/environment.development';
import {ButtonComponent} from '../../common/components/button/button.component';

@Component({
  selector: 'app-login',
  imports: [ButtonComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  CLIENT_ID = environment.GOOGLE_CLIENT_ID;

  onSignIn(googleUser: { getBasicProfile: () => any; }) {
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId());
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail());
  }
}
