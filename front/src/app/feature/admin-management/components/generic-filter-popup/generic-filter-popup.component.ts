import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {DropdownConfig, FilterConfig, FilterOption} from '../../type/components/filter.type';
import {ButtonGreyComponent} from '../../../../shared/button-grey/button-grey.component';
import {ButtonGreenActionsComponent} from '../../../../shared/button-green-actions/button-green-actions.component';

@Component({
  selector: 'app-generic-filter-popup',
  imports: [
    ButtonGreyComponent,
    ButtonGreenActionsComponent
  ],
  templateUrl: './generic-filter-popup.component.html',
  styleUrl: './generic-filter-popup.component.scss'
})
export class GenericFilterPopupComponent implements OnInit, OnDestroy {
  @Input() config!: FilterConfig;
  @Input() currentFilters: Record<string, any> = {};

  @Output() filtersApplied = new EventEmitter<Record<string, any>>();
  @Output() filtersReset : EventEmitter<void> = new EventEmitter<void>();
  @Output() popupClosed : EventEmitter<void> = new EventEmitter<void>();

  workingFilters: Record<string, any> = {};
  openDropdowns: Set<string> = new Set();

  ngOnInit(): void {
    this.workingFilters = this.deepCopy(this.currentFilters);
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  private deepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  private handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    this.config.dropdowns?.forEach(dropdown => {
      if (!target.closest(`#${dropdown.id}-select`) && !target.closest(`.${dropdown.id}-dropdown`)) {
        this.openDropdowns.delete(dropdown.id);
      }
    });
  }

  toggleDropdown(dropdownId: string): void {
    if (this.openDropdowns.has(dropdownId)) {
      this.openDropdowns.delete(dropdownId);
    } else {
      this.openDropdowns.clear();
      this.openDropdowns.add(dropdownId);
    }
  }

  isDropdownOpen(dropdownId: string): boolean {
    return this.openDropdowns.has(dropdownId);
  }

  getOptionValue(option: string | FilterOption): string {
    return typeof option === 'string' ? option : option.id;
  }

  getOptionDisplayName(option: string | FilterOption): string {
    return typeof option === 'string' ? option : option.name;
  }

  onDropdownChange(dropdownId: string, value: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const currentValues = this.workingFilters[dropdownId] || [];

    if (target.checked) {
      if (!currentValues.includes(value)) {
        this.workingFilters[dropdownId] = [...currentValues, value];
      }
    } else {
      this.workingFilters[dropdownId] = currentValues.filter((v: string) => v !== value);
    }
  }

  isValueSelected(dropdownId: string, value: string): boolean {
    const currentValues = this.workingFilters[dropdownId] || [];
    return currentValues.includes(value);
  }

  onButtonChange(buttonId: string, value: boolean | null): void {
    if (this.workingFilters[buttonId] === value) {
      this.workingFilters[buttonId] = null;
    } else {
      this.workingFilters[buttonId] = value;
    }
  }

  getDropdownDisplayText(dropdown: DropdownConfig): string {
    const selectedValues = this.workingFilters[dropdown.id] || [];

    if (selectedValues.length === 0) {
      return dropdown.placeholder;
    } else if (selectedValues.length === 1) {
      if (dropdown.type === 'checkbox' && Array.isArray(dropdown.options)) {
        const option = dropdown.options.find(opt => this.getOptionValue(opt) === selectedValues[0]);
        return option ? this.getOptionDisplayName(option) : selectedValues[0];
      }
      return selectedValues[0];
    } else {
      return `${selectedValues.length} ${dropdown.label.toLowerCase()} selected`;
    }
  }

  getDropdownWidth(dropdownId: string): number {
    const buttonElement : HTMLElement | null = document.getElementById(`${dropdownId}-select`);
    return buttonElement ? buttonElement.offsetWidth : 336;
  }

  getDropdownTop(dropdownId: string): number {
    const buttonElement : HTMLElement | null = document.getElementById(`${dropdownId}-select`);
    if (!buttonElement) return 0;

    const rect : DOMRect = buttonElement.getBoundingClientRect();
    return rect.bottom + 4;
  }

  getDropdownLeft(dropdownId: string): number {
    const buttonElement : HTMLElement | null = document.getElementById(`${dropdownId}-select`);
    if (!buttonElement) return 0;

    const rect : DOMRect = buttonElement.getBoundingClientRect();
    return rect.left;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.onClose();
        break;
      case 'Enter':
        const target = event.target as HTMLElement;
        if (target.id && target.id.endsWith('-select')) {
          const dropdownId : string = target.id.replace('-select', '');
          this.toggleDropdown(dropdownId);
          event.preventDefault();
        }
        break;
    }
  }

  onCheckboxKeyDown(event: KeyboardEvent, dropdownId: string, value: string): void {
    if (event.key === 'Enter') {
      const checkbox = event.target as HTMLInputElement;
      const newCheckedState : boolean = !checkbox.checked;
      checkbox.checked = newCheckedState;

      this.onDropdownChange(dropdownId, value, { target: checkbox } as any);

      event.preventDefault();
    }
  }

  onApply(): void {
    this.filtersApplied.emit(this.deepCopy(this.workingFilters));
    this.onClose();
  }

  onReset(): void {
    this.workingFilters = {};
    this.openDropdowns.clear();
    this.filtersReset.emit();
  }

  onClose(): void {
    this.openDropdowns.clear();
    this.popupClosed.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
