import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Category, Format} from '../../../type/session/session';
import {SessionFilters} from '../../../type/session/session-filters';
import {GenericFilterPopupComponent} from '../../generic-filter-popup/generic-filter-popup.component';
import {DropdownConfig, FilterConfig} from '../../../type/components/filter.type';

@Component({
  selector: 'app-session-filter-popup',
  imports: [
    GenericFilterPopupComponent,
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

  @Output() filtersApplied: EventEmitter<SessionFilters> = new EventEmitter<SessionFilters>();
  @Output() filtersReset : EventEmitter<void> = new EventEmitter<void>();
  @Output() popupClosed : EventEmitter<void> = new EventEmitter<void>();

  filterConfig!: FilterConfig;
  currentFiltersForGeneric: Record<string, any> = {};

  ngOnInit(): void {
    this.setupFilterConfig();
    this.setupCurrentFilters();
  }

  private setupFilterConfig(): void {
    const formatDropdown: DropdownConfig = {
      id: 'selectedFormats',
      label: 'Formats',
      placeholder: 'Select formats',
      emptyMessage: 'No formats available',
      type: 'checkbox',
      options: this.availableFormats.map(format => ({
        id: format.id,
        name: format.name,
        description: format.description
      })),
      selectedValues: this.currentFilters.selectedFormats
    };

    const categoryDropdown: DropdownConfig = {
      id: 'selectedCategories',
      label: 'Categories',
      placeholder: 'Select categories',
      emptyMessage: 'No categories available',
      type: 'checkbox',
      options: this.availableCategories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description
      })),
      selectedValues: this.currentFilters.selectedCategories
    };

    this.filterConfig = {
      title: 'Filters',
      dropdowns: [formatDropdown, categoryDropdown],
      buttons: [
        {
          id: 'taskStatus',
          label: 'Actions',
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
          selectedValue: null
        }
      ]
    };
  }

  private setupCurrentFilters(): void {
    this.currentFiltersForGeneric = {
      selectedFormats: [...this.currentFilters.selectedFormats],
      selectedCategories: [...this.currentFilters.selectedCategories]
    };
  }

  onFiltersApplied(genericFilters: Record<string, any>): void {
    const sessionFilters: SessionFilters = {
      selectedFormats: genericFilters['selectedFormats'] || [],
      selectedCategories: genericFilters['selectedCategories'] || []
    };

    this.filtersApplied.emit(sessionFilters);
  }

  onFiltersReset(): void {
    this.filtersReset.emit();
  }

  onPopupClosed(): void {
    this.popupClosed.emit();
  }
}
