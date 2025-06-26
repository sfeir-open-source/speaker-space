import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SessionFilters} from '../../../type/session/session-filters';
import {Category, Format} from '../../../type/session/session';
import {FilterConfig} from '../../../type/components/filter.type';
import {GenericFilterService} from '../../services/generic-filter.service';
import {GenericFilterPopupComponent} from '../../filter-popup/generic-filter-popup/generic-filter-popup.component';

@Component({
  selector: 'app-session-filter-popup',
  imports: [
    GenericFilterPopupComponent
  ],
  templateUrl: './session-filter-popup.component.html',
  styleUrl: './session-filter-popup.component.scss'
})
export class SessionUnifiedFilterPopupComponent implements OnInit {
  @Input() availableFormats: Format[] = [];
  @Input() availableCategories: Category[] = [];
  @Input() currentFilters: SessionFilters = {
    selectedFormats: [],
    selectedCategories: []
  };

  @Output() filtersApplied : EventEmitter<SessionFilters> = new EventEmitter<SessionFilters>();
  @Output() filtersReset : EventEmitter<void> = new EventEmitter<void>();
  @Output() popupClosed : EventEmitter<void> = new EventEmitter<void>();

  filterConfig!: FilterConfig;
  currentFiltersForGeneric: Record<string, any> = {};

  constructor(private filterService: GenericFilterService) {}

  ngOnInit(): void {
    this.setupFilterConfig();
    this.setupCurrentFilters();
  }

  private setupFilterConfig(): void {
    this.filterConfig = this.filterService.createStandardFilterConfig(
      this.availableFormats,
      this.availableCategories,
      'Session Filters',
      true,
      this.currentFilters
    );
  }

  private setupCurrentFilters(): void {
    this.currentFiltersForGeneric = {
      selectedFormats: [...this.currentFilters.selectedFormats],
      selectedCategories: [...this.currentFilters.selectedCategories]
    };
  }

  onFiltersApplied(genericFilters: Record<string, any>): void {
    const convertedFilters: SessionFilters = this.filterService.convertToSessionFilters(genericFilters);
    this.filtersApplied.emit(convertedFilters);
  }

  onFiltersReset(): void {
    this.filtersReset.emit();
  }

  onPopupClosed(): void {
    this.popupClosed.emit();
  }
}
