import { Component, OnDestroy, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserRoleService } from '../../services/team/user-role.service';
import { ButtonGreyComponent } from '../../../../shared/button-grey/button-grey.component';
import { NgClass } from '@angular/common';
import { NavbarButton, NavbarConfig } from '../../type/components/navbar-config';

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
export class NavbarAdminPageComponent implements OnInit {
  readonly config = input<NavbarConfig>({ leftButtons: [] });
  readonly activePage = input<string>('');
  readonly userRole = input<string>('');

  private readonly router = inject(Router);
  private readonly userRoleService = inject(UserRoleService);

  private readonly _currentUserRole = signal<string>('Member');
  readonly currentUserRole = this._currentUserRole.asReadonly();

  private readonly destroy$ = new Subject<void>();

  readonly visibleLeftButtons = computed(() => {
    return this.config().leftButtons.filter(button => button.isVisible !== false);
  });

  readonly rightButtonConfig = computed(() => {
    const cfg = this.config();
    return cfg.rightContent === 'custom-button' ? cfg.rightButtonConfig : null;
  });

  readonly rightButtonCssClass = computed(() => {
    const buttonConfig = this.rightButtonConfig();
    return buttonConfig?.cssClass ||
      'flex items-center justify-between text-blue-600 text-sm py-0.5 px-2 rounded-md cursor-pointer hover:bg-blue-50 transition-colors';
  });

  constructor() {
    effect(() => {
      const inputRole = this.userRole();
      if (inputRole) {
        this._currentUserRole.set(inputRole);
      }
    });
  }

  ngOnInit(): void {
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
        }
      });

    this.userRoleService.getRole()
      .pipe(takeUntil(this.destroy$))
      .subscribe(role => {
        if (role) {
          this._currentUserRole.set(role);
        }
      });
  }

  onButtonClick(button: NavbarButton): void {
    if (button.handler) {
      button.handler();
    } else if (button.route) {
      this.router.navigate([button.route]);
    }
  }

  isButtonActive(button: NavbarButton): boolean {
    return this.activePage() === button.id;
  }

  onRightButtonClick(): void {
    const rightButtonConfig = this.rightButtonConfig();
    if (rightButtonConfig?.handler) {
      rightButtonConfig.handler();
    }
  }

  getButtonHandler(button: NavbarButton): () => void {
    return () => this.onButtonClick(button);
  }
}
