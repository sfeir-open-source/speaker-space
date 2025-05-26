import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {SidebarButton, SidebarConfig} from '../../type/components/sidebar-config';
import {filter, Subscription} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
import {NgClass} from '@angular/common';
import {ButtonWithIconComponent} from '../../../../shared/button-with-icon/button-with-icon.component';

@Component({
  selector: 'app-sidebar-admin-page',
  standalone: true,
  imports: [
    NgClass,
    ButtonWithIconComponent
  ],
  templateUrl: './sidebar-admin-page.component.html',
  styleUrl: './sidebar-admin-page.component.scss'
})
export class SidebarAdminPageComponent implements OnInit, OnDestroy, OnChanges {
  @Input() config!: SidebarConfig;
  @Input() contextParam: string = '';

  private routerSubscription?: Subscription;
  activeSection: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateActiveSection();

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveSection();
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.updateActiveSection();
    }
  }

  updateActiveSection(): void {
    const url: string = this.router.url;

    const activeButton = this.config.buttons.find(button =>
      url.includes(`/${button.route}`)
    );

    this.activeSection = activeButton?.route || '';
  }

  onButtonClick(button: SidebarButton): void {
    if (button.isDisabled || !this.contextParam) {
      return;
    }

    this.router.navigate([`/${button.route}`, this.contextParam]);
  }

  isButtonActive(button: SidebarButton): boolean {
    return this.activeSection === button.route;
  }

  getButtonClasses(button: SidebarButton): string {
    const baseClasses = button.cssClass || '';
    const activeClasses = this.isButtonActive(button) ? 'bg-gray-100' : '';

    return `${baseClasses} ${activeClasses}`.trim();
  }
}
