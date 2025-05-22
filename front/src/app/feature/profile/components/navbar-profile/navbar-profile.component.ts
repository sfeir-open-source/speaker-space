import {Component, inject, OnInit, Signal} from '@angular/core';
import {Router} from '@angular/router';
import {ButtonWithIconComponent} from '../../../../shared/button-with-icon/button-with-icon.component';
import {ButtonGreenActionsComponent} from '../../../../shared/button-green-actions/button-green-actions.component';
import {UserStateService} from '../../../../core/services/user-services/user-state.service';

@Component({
  selector: 'app-navbar-profile',
  standalone:true,
  imports: [
    ButtonWithIconComponent,
    ButtonGreenActionsComponent,
  ],
  templateUrl: './navbar-profile.component.html',
  styleUrl: './navbar-profile.component.scss'
})
export class NavbarProfileComponent implements OnInit{
  private userState : UserStateService = inject(UserStateService);
  protected userPhotoURL: Signal<string>;

  constructor(
    private router: Router,
  ) {
    this.userPhotoURL = this.userState.photoURL;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  ngOnInit(): void {
  }

  handlePictureError(event: any) {
    event.target.src = 'img/profil-picture.svg';
  }
}
