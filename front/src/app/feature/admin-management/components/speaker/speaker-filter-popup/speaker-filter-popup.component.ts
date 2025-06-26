import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {GenericFilterPopupComponent} from '../../filter-popup/generic-filter-popup/generic-filter-popup.component';
import {Category, Format} from '../../../type/session/session';
import {SpeakerFilters} from '../../../type/speaker/speaker-filters';
import {FilterConfig} from '../../../type/components/filter.type';
import {GenericFilterService} from '../../services/generic-filter.service';

@Component({
  selector: 'app-speaker-filter-popup',
  imports: [
    GenericFilterPopupComponent
  ],
  templateUrl: './speaker-filter-popup.component.html',
  styleUrl: './speaker-filter-popup.component.scss'
})
export class SpeakerFilterPopupComponent implements OnInit {
  @Input() availableFormats: Format[] = [];
  @Input() availableCategories: Category[] = [];
  @Input() currentFilters: SpeakerFilters = {
    selectedFormats: [],
    selectedCategories: [],
    hasCompleteTasks: null
  };

  @Output() filtersApplied:EventEmitter<SpeakerFilters> = new EventEmitter<SpeakerFilters>();
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
      'Speaker Filters',
      true,
      this.currentFilters
    );
  }

  private setupCurrentFilters(): void {
    this.currentFiltersForGeneric = {
      selectedFormats: [...this.currentFilters.selectedFormats],
      selectedCategories: [...this.currentFilters.selectedCategories],
      hasCompleteTasks: this.currentFilters.hasCompleteTasks
    };
  }

  onFiltersApplied(genericFilters: Record<string, any>): void {
    const convertedFilters: SpeakerFilters = this.filterService.convertToSpeakerFilters(genericFilters);
    this.filtersApplied.emit(convertedFilters);
  }

  onFiltersReset(): void {
    this.filtersReset.emit();
  }

  onPopupClosed(): void {
    this.popupClosed.emit();
  }
}
