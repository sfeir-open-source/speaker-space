import {Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Category, Format} from '../../../type/session/session';
import {SessionFilters} from '../../../type/session/session-filters';
import {ButtonGreenActionsComponent} from '../../../../../shared/button-green-actions/button-green-actions.component';
import {ButtonGreyComponent} from '../../../../../shared/button-grey/button-grey.component';

@Component({
  selector: 'app-session-filter-popup',
  imports: [
    ButtonGreenActionsComponent,
    ButtonGreyComponent,
  ],
  templateUrl: './session-filter-popup.component.html',
  styleUrl: './session-filter-popup.component.scss'
})
export class SessionFilterPopupComponent implements OnInit {
  @Input() availableFormats: Format[] = [];
  @Input() availableCategories: Category[] = [];
  @Input() currentFilters: SessionFilters = {
    selectedFormats: [],
    selectedCategories: []
  };

  @ViewChild('formatSelectButton') formatSelectButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('categorySelectButton') categorySelectButton!: ElementRef<HTMLButtonElement>;

  @Output() filtersApplied = new EventEmitter<SessionFilters>();
  @Output() filtersReset = new EventEmitter<void>();
  @Output() popupClosed = new EventEmitter<void>();

  workingFilters: SessionFilters = {
    selectedFormats: [],
    selectedCategories: []
  };

  showFormatDropdown = false;
  showCategoryDropdown = false;

  ngOnInit(): void {
    this.workingFilters = {
      selectedFormats: [...this.currentFilters.selectedFormats],
      selectedCategories: [...this.currentFilters.selectedCategories]
    };

    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  private handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    if (!target.closest('#format-select') && !target.closest('.format-dropdown')) {
      this.showFormatDropdown = false;
    }

    if (!target.closest('#category-select') && !target.closest('.category-dropdown')) {
      this.showCategoryDropdown = false;
    }
  }

  getFormatName(formatId: string): string {
    const format = this.availableFormats.find(f => f.id === formatId);
    return format ? format.name : 'Unknown format';
  }

  getCategoryName(categoryId: string): string {
    const category = this.availableCategories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown category';
  }

  isFormatSelected(formatId: string): boolean {
    return this.workingFilters.selectedFormats.includes(formatId);
  }

  isCategorySelected(categoryId: string): boolean {
    return this.workingFilters.selectedCategories.includes(categoryId);
  }

  onApply(): void {
    this.filtersApplied.emit({
      selectedFormats: [...this.workingFilters.selectedFormats],
      selectedCategories: [...this.workingFilters.selectedCategories]
    });
    this.onClose();
  }

  onReset(): void {
    this.workingFilters = {
      selectedFormats: [],
      selectedCategories: []
    };
    this.showFormatDropdown = false;
    this.showCategoryDropdown = false;
    this.filtersReset.emit();
  }

  onClose(): void {
    this.showFormatDropdown = false;
    this.showCategoryDropdown = false;
    this.popupClosed.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.onClose();
        break;
      case 'Enter':
        if (event.target === document.querySelector('#format-select')) {
          this.toggleFormatDropdown();
          event.preventDefault();
        } else if (event.target === document.querySelector('#category-select')) {
          this.toggleCategoryDropdown();
          event.preventDefault();
        }
        break;
      case 'ArrowDown':
        if (this.showFormatDropdown || this.showCategoryDropdown) {
          this.handleArrowNavigation(event, 'down');
          event.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (this.showFormatDropdown || this.showCategoryDropdown) {
          this.handleArrowNavigation(event, 'up');
          event.preventDefault();
        }
        break;
    }
  }

  private handleArrowNavigation(event: KeyboardEvent, direction: 'up' | 'down'): void {
    const activeDropdown = this.showFormatDropdown ? 'format' : 'category';
    const checkboxes = document.querySelectorAll(
      `input[type="checkbox"][data-dropdown="${activeDropdown}"]`
    );

    if (checkboxes.length === 0) return;

    const currentIndex = Array.from(checkboxes).findIndex(
      checkbox => checkbox === document.activeElement
    );

    let nextIndex: number;
    if (direction === 'down') {
      nextIndex = currentIndex < checkboxes.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : checkboxes.length - 1;
    }

    (checkboxes[nextIndex] as HTMLElement).focus();
  }

  onFormatChange(formatId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.toggleFormatSelection(formatId, target.checked);
  }

  onCategoryChange(categoryId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.toggleCategorySelection(categoryId, target.checked);
  }

  private toggleFormatSelection(formatId: string, isChecked: boolean): void {
    if (isChecked) {
      if (!this.workingFilters.selectedFormats.includes(formatId)) {
        this.workingFilters.selectedFormats.push(formatId);
      }
    } else {
      this.workingFilters.selectedFormats = this.workingFilters.selectedFormats
        .filter(id => id !== formatId);
    }
  }

  private toggleCategorySelection(categoryId: string, isChecked: boolean): void {
    if (isChecked) {
      if (!this.workingFilters.selectedCategories.includes(categoryId)) {
        this.workingFilters.selectedCategories.push(categoryId);
      }
    } else {
      this.workingFilters.selectedCategories = this.workingFilters.selectedCategories
        .filter(id => id !== categoryId);
    }
  }

  onCheckboxKeyDown(event: KeyboardEvent, itemId: string, type: 'format' | 'category'): void {
    if (event.key === 'Space') {
      return;
    } else if (event.key === 'Enter') {
      const checkbox = event.target as HTMLInputElement;
      const newCheckedState = !checkbox.checked;
      checkbox.checked = newCheckedState;

      if (type === 'format') {
        this.toggleFormatSelection(itemId, newCheckedState);
      } else {
        this.toggleCategorySelection(itemId, newCheckedState);
      }

      event.preventDefault();
    }
  }

  getDropdownWidth(type: 'format' | 'category'): number {
    const buttonElement = type === 'format'
      ? this.formatSelectButton?.nativeElement
      : this.categorySelectButton?.nativeElement;

    if (!buttonElement) {
      return 336;
    }

    return buttonElement.offsetWidth;
  }

  getDropdownTop(type: 'format' | 'category'): number {
    const buttonElement = type === 'format'
      ? this.formatSelectButton?.nativeElement
      : this.categorySelectButton?.nativeElement;

    if (!buttonElement) return 0;

    const rect = buttonElement.getBoundingClientRect();
    return rect.bottom + 4;
  }

  getDropdownLeft(type: 'format' | 'category'): number {
    const buttonElement = type === 'format'
      ? this.formatSelectButton?.nativeElement
      : this.categorySelectButton?.nativeElement;

    if (!buttonElement) return 0;

    const rect = buttonElement.getBoundingClientRect();
    return rect.left;
  }

  toggleFormatDropdown(): void {
    this.showFormatDropdown = !this.showFormatDropdown;
    if (this.showFormatDropdown) {
      this.showCategoryDropdown = false;

      setTimeout(() => {
      }, 0);
    }
  }

  toggleCategoryDropdown(): void {
    this.showCategoryDropdown = !this.showCategoryDropdown;
    if (this.showCategoryDropdown) {
      this.showFormatDropdown = false;
      setTimeout(() => {
      }, 0);
    }
  }
}
