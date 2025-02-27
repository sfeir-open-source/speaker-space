import { Component } from '@angular/core';
import {environment} from '../../../environments/environment.development';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  CLIENT_ID = environment.GOOGLE_CLIENT_ID;
}
