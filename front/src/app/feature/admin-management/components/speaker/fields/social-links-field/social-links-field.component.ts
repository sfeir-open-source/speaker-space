import {Component, computed, EventEmitter, input, Input, output, Output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonComponent} from '../../../../../../shared/button/button.component';

@Component({
  selector: 'app-social-links-field',
  imports: [
    FormsModule,
    ButtonComponent
  ],
  templateUrl: './social-links-field.component.html',
  styleUrl: './social-links-field.component.scss'
})

export class SocialLinksFieldComponent {
  socialLinks = input<string[]>([]);
  socialLinksChange = output<string[]>();

  newSocialLink = signal('');
  errorMessage = signal<string | null>(null);

  maxLinksReached = computed(() => this.socialLinks().length >= 5);
  isAddDisabled = computed(() =>
    !this.newSocialLink().trim() || this.maxLinksReached()
  );

  remainingSlots = computed(() => 5 - this.socialLinks().length);

  addSocialLink(): void {
    const link = this.newSocialLink().trim();
    if (!link) return;

    if (this.socialLinks().includes(link)) {
      this.showTemporaryError('This social link already exists');
      return;
    }

    if (!this.isValidUrl(link)) {
      this.showTemporaryError('Please enter a valid URL');
      return;
    }

    if (this.maxLinksReached()) {
      this.showTemporaryError('Maximum 5 social links allowed');
      return;
    }

    const updatedLinks = [...this.socialLinks(), link];
    this.socialLinksChange.emit(updatedLinks);

    this.newSocialLink.set('');
    this.errorMessage.set(null);
  }

  removeSocialLink(index: number): void {
    const links = this.socialLinks();

    if (index >= 0 && index < links.length) {
      const updatedLinks = links.filter((_, i) => i !== index);
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
    this.errorMessage.set(message);

    setTimeout(() => {
      if (this.errorMessage() === message) {
        this.errorMessage.set(null);
      }
    }, 3000);
  }
}
