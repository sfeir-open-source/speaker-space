import { Component } from '@angular/core';
import {FooterComponent} from '../../common/components/footer/footer.component';
import {ButtonComponent} from '../../common/components/button/button.component';

@Component({
  selector: 'app-login',
  imports: [
    ButtonComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

}
