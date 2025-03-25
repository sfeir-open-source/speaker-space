import { Component } from '@angular/core';
import {NavbarProfileComponent} from '../../shared/navbar-profile/navbar-profile.component';

@Component({
  selector: 'app-profile',
  imports: [
    NavbarProfileComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

}
