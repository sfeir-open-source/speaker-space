import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {ButtonWithIconComponent} from '../../../../shared/button-with-icon/button-with-icon.component';

@Component({
  selector: 'app-profile-sidebar',
  standalone:true,
  imports: [
    ButtonWithIconComponent
  ],
  templateUrl: './profile-sidebar.component.html',
  styleUrl: './profile-sidebar.component.scss'
})
export class ProfileSidebarComponent {
  @Input() activeSection: string = '';

  constructor(private router: Router) {}

  navigateTo(path: string) {
    if (path.startsWith('#')) {
      const elementId = path.substring(1);
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      this.router.navigate([path]);
    }
  }

    isActive(sectionId: string): boolean {
    return this.activeSection === sectionId.replace('#', '');
  }
}
