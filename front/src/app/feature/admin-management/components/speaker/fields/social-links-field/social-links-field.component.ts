import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  ButtonGreenActionsComponent
} from '../../../../../../shared/button-green-actions/button-green-actions.component';

@Component({
  selector: 'app-social-links-field',
  imports: [
    ButtonGreenActionsComponent,
    FormsModule
  ],
  templateUrl: './social-links-field.component.html',
  styleUrl: './social-links-field.component.scss'
})
export class SocialLinksFieldComponent {
  @Input() socialLinks: string[] = [];
  @Output() socialLinksChange = new EventEmitter<string[]>();

  newSocialLink: string = '';
  errorMessage: string | null = null;

  addSocialLink(): void {
    const link : string = this.newSocialLink.trim();
    if (!link) return;

    if (this.socialLinks.includes(link)) {
      this.showTemporaryError('This social link already exists');
      return;
    }

    if (!this.isValidUrl(link)) {
      this.showTemporaryError('Please enter a valid URL');
      return;
    }

    if (this.socialLinks.length >= 5) {
      this.showTemporaryError('Maximum 5 social links allowed');
      return;
    }

    const updatedLinks = [...this.socialLinks, link];
    this.socialLinksChange.emit(updatedLinks);
    this.newSocialLink = '';
    this.errorMessage = null;
  }

  removeSocialLink(index: number): void {
    if (index >= 0 && index < this.socialLinks.length) {
      const updatedLinks = this.socialLinks.filter((_, i) => i !== index);
      this.socialLinksChange.emit(updatedLinks);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  private showTemporaryError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = null;
      }
    }, 3000);
  }
}
