import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Category, Format, SessionImportData} from '../../../type/session/session';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';

@Component({
  selector: 'app-session-detail-page',
  imports: [
    ButtonGreyComponent
  ],
  templateUrl: './session-detail-page.component.html',
  styleUrl: './session-detail-page.component.scss'
})
export class SessionDetailPageComponent  implements OnInit, OnDestroy {
  @Input() session: SessionImportData | null = null;
  @Input() format: Format | null = null;
  @Input() category: Category | null = null;
  @Input() isOpen: boolean = false;

  @Output() closeEvent = new EventEmitter<void>();
  @Output() editEvent = new EventEmitter<SessionImportData>();

  ngOnInit(): void {
    // ✅ Gestion de la touche Escape
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  /**
   * ✅ Ferme la modal
   */
  closeModal(): void {
    this.closeEvent.emit();
  }

  /**
   * ✅ Gère le clic sur le backdrop - CORRIGÉ pour bien fermer
   */
  onBackdropClick(event: Event): void {
    // Vérifier si le clic est directement sur le backdrop
    const target = event.target as HTMLElement;
    if (target.classList.contains('bg-gray-300/90') ||
      event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  /**
   * ✅ Gère la touche Escape
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen) {
      this.closeModal();
    }
  }

  /**
   * ✅ Émet l'événement d'édition
   */
  onEditSession(): void {
    if (this.session) {
      this.editEvent.emit(this.session);
    }
  }
}
