import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {SpeakerFilters} from '../../../type/speaker/speaker-filters';
import {GenericFilterPopupComponent} from '../../generic-filter-popup/generic-filter-popup.component';
import {ButtonConfig, DropdownConfig, FilterConfig} from '../../../type/components/filter.type';

@Component({
  selector: 'app-speaker-filter-popup',
  imports: [
    GenericFilterPopupComponent,
  ],
  templateUrl: './speaker-filter-popup.component.html',
  styleUrl: './speaker-filter-popup.component.scss'
})
export class SpeakerFilterPopupComponent implements OnInit {
  @Input() availableCompanies: string[] = [];
  @Input() currentFilters: SpeakerFilters = {
    selectedCompanies: [],
    hasCompleteTasks: null
  };

  @Output() filtersApplied : EventEmitter<SpeakerFilters> = new EventEmitter<SpeakerFilters>();
  @Output() filtersReset:EventEmitter<void> = new EventEmitter<void>();
  @Output() popupClosed: EventEmitter<void> = new EventEmitter<void>();

  filterConfig!: FilterConfig;
  currentFiltersForGeneric: Record<string, any> = {};

  ngOnInit(): void {
    this.setupFilterConfig();
    this.setupCurrentFilters();
  }

  private setupFilterConfig(): void {
    const companyDropdown: DropdownConfig = {
      id: 'selectedCompanies',
      label: 'Companies',
      placeholder: 'Select companies',
      emptyMessage: 'No companies available',
      type: 'checkbox',
      options: this.availableCompanies,
      selectedValues: this.currentFilters.selectedCompanies
    };

    const taskStatusButton: ButtonConfig = {
      id: 'hasCompleteTasks',
      label: 'Task Status',
      options: [
        {
          value: true,
          label: 'Complete Tasks',
          activeClass: 'rounded-md mr-5 text-sm inline-flex items-center gap-2 bg-action hover:bg-action text-white border border-green-600 cursor-pointer shadow-sm px-4 py-2',
          inactiveClass: 'rounded-md mr-5 text-sm inline-flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 cursor-pointer shadow-sm px-4 py-2 text-gray-600'
        },
        {
          value: false,
          label: 'Missing Tasks',
          activeClass: 'rounded-md mr-5 text-sm inline-flex items-center gap-2 bg-action hover:bg-action text-white border border-green-600 cursor-pointer shadow-sm px-4 py-2',
          inactiveClass: 'rounded-md mr-5 text-sm inline-flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 cursor-pointer shadow-sm px-4 py-2 text-gray-600'
        }
      ],
      selectedValue: this.currentFilters.hasCompleteTasks
    };

    this.filterConfig = {
      title: 'Speaker Filters',
      dropdowns: [companyDropdown],
      buttons: [taskStatusButton]
    };
  }

  private setupCurrentFilters(): void {
    this.currentFiltersForGeneric = {
      selectedCompanies: [...this.currentFilters.selectedCompanies],
      hasCompleteTasks: this.currentFilters.hasCompleteTasks
    };
  }

  onFiltersApplied(genericFilters: Record<string, any>): void {
    const speakerFilters: SpeakerFilters = {
      selectedCompanies: genericFilters['selectedCompanies'] || [],
      hasCompleteTasks: genericFilters['hasCompleteTasks'] !== undefined ? genericFilters['hasCompleteTasks'] : null
    };

    this.filtersApplied.emit(speakerFilters);
  }

  onFiltersReset(): void {
    this.filtersReset.emit();
  }

  onPopupClosed(): void {
    this.popupClosed.emit();
  }
}
