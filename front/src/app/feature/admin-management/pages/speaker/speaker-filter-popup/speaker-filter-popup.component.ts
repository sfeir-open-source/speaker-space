import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {ButtonGreenActionsComponent} from "../../../../../shared/button-green-actions/button-green-actions.component";
import {SpeakerFilters} from '../../../type/speaker/speaker-filters';

@Component({
  selector: 'app-speaker-filter-popup',
    imports: [
        ButtonGreenActionsComponent,
    ],
  templateUrl: './speaker-filter-popup.component.html',
  styleUrl: './speaker-filter-popup.component.scss'
})
export class SpeakerFilterPopupComponent implements OnInit, OnDestroy {
  @Input() availableCompanies: string[] = [];
  @Input() currentFilters: SpeakerFilters = {
    selectedCompanies: [],
    hasCompleteTasks: null
  };

  @ViewChild('companySelectButton') companySelectButton!: ElementRef<HTMLButtonElement>;

  @Output() filtersApplied = new EventEmitter<SpeakerFilters>();
  @Output() filtersReset = new EventEmitter<void>();
  @Output() popupClosed = new EventEmitter<void>();

  workingFilters: SpeakerFilters = {
    selectedCompanies: [],
    hasCompleteTasks: null
  };

  showCompanyDropdown = false;

  ngOnInit(): void {
    this.workingFilters = {
      selectedCompanies: [...this.currentFilters.selectedCompanies],
      hasCompleteTasks: this.currentFilters.hasCompleteTasks
    };

    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  setTaskStatus(status: boolean | null): void {
    if (this.workingFilters.hasCompleteTasks === status) {
      this.workingFilters.hasCompleteTasks = null;
    } else {
      this.workingFilters.hasCompleteTasks = status;
    }
  }

  isCompanySelected(company: string): boolean {
    return this.workingFilters.selectedCompanies.includes(company);
  }

  onCompanyChange(company: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.toggleCompanySelection(company, target.checked);
  }

  private toggleCompanySelection(company: string, isChecked: boolean): void {
    if (isChecked) {
      if (!this.workingFilters.selectedCompanies.includes(company)) {
        this.workingFilters.selectedCompanies.push(company);
      }
    } else {
      this.workingFilters.selectedCompanies = this.workingFilters.selectedCompanies
        .filter(c => c !== company);
    }
  }

  private handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    if (!target.closest('#company-select') && !target.closest('.company-dropdown')) {
      this.showCompanyDropdown = false;
    }
  }

  toggleCompanyDropdown(): void {
    this.showCompanyDropdown = !this.showCompanyDropdown;
  }

  getDropdownWidth(type: 'company'): number {
    const buttonElement = type === 'company'
      ? this.companySelectButton?.nativeElement : '';

    if (!buttonElement) {
      return 336;
    }

    return buttonElement.offsetWidth;
  }

  getDropdownTop(type: 'company'): number {
    const buttonElement = type === 'company'
      ? this.companySelectButton?.nativeElement : '';

    if (!buttonElement) return 0;

    const rect = buttonElement.getBoundingClientRect();
    return rect.bottom + 4;
  }

  getDropdownLeft(type: 'company'): number {
    const buttonElement = type === 'company'
      ? this.companySelectButton?.nativeElement : '';

    if (!buttonElement) return 0;

    const rect = buttonElement.getBoundingClientRect();
    return rect.left;
  }

  onCheckboxKeyDown(event: KeyboardEvent, itemId: string, type: 'company'): void {
    if (event.key === 'Enter') {
      const checkbox = event.target as HTMLInputElement;
      const newCheckedState : boolean = !checkbox.checked;
      checkbox.checked = newCheckedState;

      if (type === 'company') {
        this.toggleCompanySelection(itemId, newCheckedState);
      }
      event.preventDefault();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.onClose();
        break;
      case 'Enter':
        if (event.target === document.querySelector('#company-select')) {
          this.toggleCompanyDropdown();
          event.preventDefault();
        }
        break;
    }
  }

  onApply(): void {
    this.filtersApplied.emit({
      selectedCompanies: [...this.workingFilters.selectedCompanies],
      hasCompleteTasks: this.workingFilters.hasCompleteTasks
    });
    this.onClose();
  }

  onReset(): void {
    this.workingFilters = {
      selectedCompanies: [],
      hasCompleteTasks: null
    };
    this.showCompanyDropdown = false;
    this.filtersReset.emit();
  }

  onClose(): void {
    this.showCompanyDropdown = false;
    this.popupClosed.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
