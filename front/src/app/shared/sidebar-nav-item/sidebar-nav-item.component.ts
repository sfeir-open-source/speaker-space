import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-sidebar-nav-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-nav-item.component.html',
  styleUrl: './sidebar-nav-item.component.scss'
})
export class SidebarNavItemComponent {
  @Input() route: string = '';
  @Input() materialIcon: string = '';
  @Input() hasNotification: boolean = false;
  @Input() buttonHandler: (() => void) | null = null;
  @Input() notificationCount: number = 1;

  @Output() itemClick = new EventEmitter<string>();

  navigate() {
    this.itemClick.emit(this.route);
  }

  handleButtonClick() {
    if (this.buttonHandler) {
      this.buttonHandler();
    } else if (this.route) {
      this.itemClick.emit(this.route);
    }
  }
}
