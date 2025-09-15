import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button-login',
  imports: [CommonModule],
  templateUrl: './button-login.component.html',
  styleUrl: './button-login.component.scss'
})
export class ButtonLoginComponent {
  @Input() buttonType: 'button-red' | 'button-black' | 'button-white' = 'button-red';
  @Input() disabled: boolean = false;
  @Input() iconSrc: string = '';
  @Input() iconAlt: string = '';

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.error(`Erreur de chargement de l'icône: ${img.src}`);
  }

  hasIcon(): boolean {
    return this.iconSrc.trim() !== '';
  }

  getButtonClasses(): string {
    const baseClasses = 'text-sm leading-6 flex w-full items-center justify-center gap-3 rounded-md px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const typeClasses = {
      'button-red': 'bg-red-500 text-white hover:bg-red-600 focus-visible:outline-red-600 cursor-pointer',
      'button-black': 'bg-black text-white hover:bg-gray-800 focus-visible:outline-gray-900 cursor-pointer',
      'button-white': 'bg-white text-black border border-black hover:bg-gray-50 focus-visible:outline-gray-900 cursor-pointer'
    };

    return `${baseClasses} ${typeClasses[this.buttonType]}`;
  }
}
