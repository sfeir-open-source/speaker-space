import {Component, input} from '@angular/core';
import {Router} from '@angular/router';
import {ButtonComponent} from '../../../../shared/button/button.component';

@Component({
  selector: 'app-profile-sidebar',
  standalone:true,
  imports: [
    ButtonComponent
  ],
  templateUrl: './profile-sidebar.component.html',
  styleUrl: './profile-sidebar.component.scss'
})
export class ProfileSidebarComponent {
  activeSection = input<string>('');

  constructor(private router: Router) {}

  navigateTo(path: string): void {
    if (path.startsWith('#')) {
      const elementId = path.substring(1);
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    } else {
      this.router.navigate([path]);
    }
  }

  isActive(sectionId: string): boolean {
    return this.activeSection() === sectionId.replace('#', '');
  }

  getSidebarButtonClasses(sectionId: string): string {
    const baseClasses = 'group flex items-center gap-x-3 w-full text-left p-2 leading-6 transition-colors hover:bg-gray-100';

    const activeClasses = this.isActive(sectionId)
      ? 'bg-gray-100'
      : '';

    return `${baseClasses} ${activeClasses}`.trim();
  }
}
