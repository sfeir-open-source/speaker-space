import { Component, OnInit, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { SidebarButton, SidebarConfig } from '../../type/components/sidebar-config';
import { Subject, takeUntil, filter } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import {ButtonComponent} from '../../../../shared/button/button.component';

@Component({
  selector: 'app-sidebar-admin-page',
  standalone: true,
  imports: [
    NgClass,
    ButtonComponent
  ],
  templateUrl: './sidebar-admin-page.component.html',
  styleUrl: './sidebar-admin-page.component.scss'
})
export class SidebarAdminPageComponent implements OnInit, OnDestroy {
  readonly config = input.required<SidebarConfig>();
  readonly contextParam = input<string>('');

  private readonly router = inject(Router);

  private readonly _activeSection = signal<string>('');
  readonly activeSection = this._activeSection.asReadonly();

  private readonly destroy$ = new Subject<void>();

  readonly navigationState = computed(() => {
    const contextParam = this.contextParam();
    const hasConfig = !!this.config();

    return {
      canNavigate: !!contextParam && hasConfig,
      contextParam,
      hasValidConfig: hasConfig && this.config().buttons.length > 0
    };
  });

  constructor() {
    effect(() => {
      this.config();
      this.updateActiveSection();
    });
  }

  ngOnInit(): void {
    this.updateActiveSection();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateActiveSection();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateActiveSection(): void {
    const url = this.router.url;
    const config = this.config();

    if (!config || !config.buttons) {
      this._activeSection.set('');
      return;
    }

    const activeButton = config.buttons.find(button =>
      url.includes(`/${button.route}`)
    );

    this._activeSection.set(activeButton?.route || '');
  }

  onButtonClick(button: SidebarButton): void {
    const navState = this.navigationState();

    if (button.isDisabled || !navState.canNavigate) {
      return;
    }

    this.router.navigate([`/${button.route}`, navState.contextParam]);
  }

  isButtonActive(button: SidebarButton): boolean {
    return this.activeSection() === button.route;
  }

  getButtonClasses(button: SidebarButton): string {
    const isActive = this.isButtonActive(button);
    return this.calculateButtonClasses(button, isActive);
  }

  private calculateButtonClasses(button: SidebarButton, isActive: boolean): string {
    const baseClasses = "const baseClasses = 'group flex items-center gap-x-3 w-full text-left p-2 leading-6 transition-colors hover:bg-gray-100'";
    const activeClasses = isActive ? 'bg-gray-100' : '';

    return `${baseClasses} ${activeClasses}`.trim();
  }
}
