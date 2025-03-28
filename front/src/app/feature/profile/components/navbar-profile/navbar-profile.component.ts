import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ButtonWithIconComponent} from '../../../../shared/button-with-icon/button-with-icon.component';
import {ButtonGreenActionsComponent} from '../../../../shared/button-green-actions/button-green-actions.component';
import {Observable} from 'rxjs';
import {ProfileService} from '../../service/profile.service';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-navbar-profile',
  imports: [
    ButtonWithIconComponent,
    ButtonGreenActionsComponent,
    AsyncPipe,
  ],
  templateUrl: './navbar-profile.component.html',
  styleUrl: './navbar-profile.component.scss'
})
export class NavbarProfileComponent implements OnInit{
  userPhotoURL$: Observable<string | null>;

  constructor(
    private router: Router,
    public profileService: ProfileService
  ) {
    this.userPhotoURL$ = this.profileService.userPhotoURL$;
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
