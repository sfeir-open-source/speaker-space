import {Component, OnInit} from '@angular/core';
import {ButtonWithIconComponent} from '../button-with-icon/button-with-icon.component';
import {ButtonGreenActionsComponent} from '../button-green-actions/button-green-actions.component';
import {Router} from '@angular/router';
import {SidebarService} from '../../core/sidebar/service/sidebar.service';

@Component({
  selector: 'app-navbar-profile',
  imports: [
    ButtonWithIconComponent,
    ButtonGreenActionsComponent
  ],
  templateUrl: './navbar-profile.component.html',
  styleUrl: './navbar-profile.component.scss'
})
export class NavbarProfileComponent implements OnInit{
  userPhotoURL: string | null = null;

  constructor(
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  ngOnInit() {
    this.userPhotoURL = this.sidebarService.userPhotoURL;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
