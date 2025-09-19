import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {LoginFormComponent} from '../login-form/login-form.component';

@Component({
  selector: 'app-login',
  imports: [LoginFormComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
}
