import { Component } from '@angular/core';
import {environment} from '../../../environments/environment.development';
import {ButtonComponent} from '../../common/components/button/button.component';

@Component({
  selector: 'app-login',
  imports: [ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  CLIENT_ID = environment.GOOGLE_CLIENT_ID;
}
