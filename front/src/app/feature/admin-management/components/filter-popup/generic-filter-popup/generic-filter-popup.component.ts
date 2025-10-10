import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  effect,
  input,
  output,
  signal
} from '@angular/core';
import { DropdownConfig, FilterConfig, FilterOption } from '../../../type/components/filter.type';
import {ButtonComponent} from '../../../../../shared/button/button.component';

@Component({
  selector: 'app-generic-filter-popup',
  imports: [
    ButtonComponent
  ],
  templateUrl: './generic-filter-popup.component.html',
  standalone: true,
  styleUrl: './generic-filter-popup.component.scss'
})
export class GenericFilterPopupComponent implements OnInit, OnDestroy {
  readonly config = input.required<FilterConfig>();
  readonly currentFilters = input<Record<string, any>>({});

  readonly filtersApplied = output<Record<string, any>>();
  readonly filtersReset = output<void>();
  readonly popupClosed = output<void>();

  private readonly _workingFilters = signal<Record<string, any>>({});
  private readonly _openDropdowns = signal<Set<string>>(new Set());
  readonly workingFilters = this._workingFilters.asReadonly();
  readonly openDropdowns = this._openDropdowns.asReadonly();


  readonly hasButtons = computed(() => {
    const buttons = this.config().buttons;
    return buttons !== undefined && buttons.length > 0;
  });

  readonly hasDropdowns = computed(() => {
    const dropdowns = this.config().dropdowns;
    return dropdowns !== undefined && dropdowns.length > 0;
  });

  readonly safeButtons = computed(() => {
    return this.config().buttons || [];
  });

  readonly safeDropdowns = computed(() => {
    return this.config().dropdowns || [];
  });

  private documentClickHandler?: (event: Event) => void;

  constructor() {
    effect(() => {
      const current = this.currentFilters();
      this._workingFilters.set(this.deepCopy(current));
    });
  }

  ngOnInit(): void {
    this.documentClickHandler = this.handleDocumentClick.bind(this);
    document.addEventListener('click', this.documentClickHandler);
  }

  ngOnDestroy(): void {
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
    }
  }

  private deepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  private handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const currentConfig = this.config();
    const currentOpenDropdowns = this.openDropdowns();

    currentConfig.dropdowns?.forEach(dropdown => {
      if (!target.closest(`#${dropdown.id}-select`) && !target.closest(`.${dropdown.id}-dropdown`)) {
        if (currentOpenDropdowns.has(dropdown.id)) {
          const newSet = new Set(currentOpenDropdowns);
          newSet.delete(dropdown.id);
          this._openDropdowns.set(newSet);
        }
      }
    });
  }

  toggleDropdown(dropdownId: string): void {
    const currentOpenDropdowns = this.openDropdowns();
    const newSet = new Set<string>();

    if (currentOpenDropdowns.has(dropdownId)) {
      currentOpenDropdowns.forEach(id => {
        if (id !== dropdownId) newSet.add(id);
      });
    } else {
      newSet.add(dropdownId);
    }

    this._openDropdowns.set(newSet);
  }

  isDropdownOpen(dropdownId: string): boolean {
    return this.openDropdowns().has(dropdownId);
  }

  getOptionValue(option: string | FilterOption): string {
    return typeof option === 'string' ? option : option.id;
  }

  getOptionDisplayName(option: string | FilterOption): string {
    return typeof option === 'string' ? option : option.name;
  }

  onDropdownChange(dropdownId: string, value: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const currentFilters = this.workingFilters();
    const currentValues = currentFilters[dropdownId] || [];

    const newFilters = { ...currentFilters };

    if (target.checked) {
      if (!currentValues.includes(value)) {
        newFilters[dropdownId] = [...currentValues, value];
      }
    } else {
      newFilters[dropdownId] = currentValues.filter((v: string) => v !== value);
    }

    this._workingFilters.set(newFilters);
  }

  isValueSelected(dropdownId: string, value: string): boolean {
    const currentValues = this.workingFilters()[dropdownId] || [];
    return currentValues.includes(value);
  }

  onButtonChange(buttonId: string, value: boolean | null): void {
    const currentFilters = this.workingFilters();
    const newFilters = { ...currentFilters };

    if (currentFilters[buttonId] === value) {
      newFilters[buttonId] = null;
    } else {
      newFilters[buttonId] = value;
    }

    this._workingFilters.set(newFilters);
  }

  getDropdownDisplayText(dropdown: DropdownConfig): string {
    const selectedValues = this.workingFilters()[dropdown.id] || [];

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
    const buttonElement: HTMLElement | null = document.getElementById(`${dropdownId}-select`);
    return buttonElement ? buttonElement.offsetWidth : 336;
  }

  getDropdownTop(dropdownId: string): number {
    const buttonElement: HTMLElement | null = document.getElementById(`${dropdownId}-select`);
    if (!buttonElement) return 0;

    const rect: DOMRect = buttonElement.getBoundingClientRect();
    return rect.bottom + 4;
  }

  getDropdownLeft(dropdownId: string): number {
    const buttonElement: HTMLElement | null = document.getElementById(`${dropdownId}-select`);
    if (!buttonElement) return 0;

    const rect: DOMRect = buttonElement.getBoundingClientRect();
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
          const dropdownId: string = target.id.replace('-select', '');
          this.toggleDropdown(dropdownId);
          event.preventDefault();
        }
        break;
    }
  }

  onCheckboxKeyDown(event: KeyboardEvent, dropdownId: string, value: string): void {
    if (event.key === 'Enter') {
      const checkbox = event.target as HTMLInputElement;
      const newCheckedState: boolean = !checkbox.checked;
      checkbox.checked = newCheckedState;

      this.onDropdownChange(dropdownId, value, { target: checkbox } as any);
      event.preventDefault();
    }
  }

  onApply(): void {
    this.filtersApplied.emit(this.deepCopy(this.workingFilters()));
    this.onClose();
  }

  onReset(): void {
    this._workingFilters.set({});
    this._openDropdowns.set(new Set());
    this.filtersReset.emit();
  }

  getButtonClickHandler(buttonId: string, value: boolean | null): () => void {
    return () => this.onButtonChange(buttonId, value);
  }

  getDropdownToggleHandler(dropdownId: string): () => void {
    return () => this.toggleDropdown(dropdownId);
  }

  getResetHandler(): () => void {
    return () => this.onReset();
  }

  getApplyHandler(): () => void {
    return () => this.onApply();
  }

  getDropdownButtonClasses(dropdownId: string): string {
    const baseClasses = 'w-full bg-white border border-gray-300 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 justify-between';
    const activeClasses = this.isDropdownOpen(dropdownId) ? 'border-blue-500' : '';

    return `${baseClasses} ${activeClasses}`.trim();
  }

  onClose(): void {
    this._openDropdowns.set(new Set());
    this.popupClosed.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
