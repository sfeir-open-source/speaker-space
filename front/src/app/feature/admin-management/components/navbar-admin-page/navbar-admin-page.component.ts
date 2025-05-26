import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {Subscription} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
import {UserRoleService} from '../../services/team/user-role.service';
import {ButtonGreyComponent} from '../../../../shared/button-grey/button-grey.component';
import {NgClass} from '@angular/common';
import {NavbarButton, NavbarConfig} from '../../type/components/navbar-config';

@Component({
  selector: 'app-navbar-admin-page',
  standalone: true,
  imports: [
    ButtonGreyComponent,
    NgClass
  ],
  templateUrl: './navbar-admin-page.component.html',
  styleUrl: './navbar-admin-page.component.scss'
})
export class NavbarAdminPageComponent implements OnInit, OnDestroy, OnChanges {
  @Input() config: NavbarConfig = { leftButtons: [] };
  @Input() activePage: string = '';
  @Input() userRole: string = '';

  currentUserRole: string = 'Member';
  private userSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private roleSubscription?: Subscription;

  constructor(
    private router: Router,
    private userRoleService: UserRoleService
  ) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
      }
    });

    this.roleSubscription = this.userRoleService.getRole().subscribe(role => {
      if (role) {
        this.currentUserRole = role;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userRole'] && changes['userRole'].currentValue) {
      this.currentUserRole = changes['userRole'].currentValue;
    }
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
    this.roleSubscription?.unsubscribe();
  }


  onButtonClick(button: NavbarButton): void {
    if (button.handler) {
      button.handler();
    } else if (button.route) {
      this.router.navigate([button.route]);
    }
  }

  isButtonActive(button: NavbarButton): boolean {
    return this.activePage === button.id;
  }

  onRightButtonClick(): void {
    const rightButtonConfig = this.config.rightButtonConfig;
    if (rightButtonConfig?.handler) {
      rightButtonConfig.handler();
    }
  }
}
