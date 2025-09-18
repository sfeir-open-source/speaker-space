import { Component, OnInit, computed, effect, inject, input, output } from '@angular/core';
import { GenericFilterPopupComponent } from '../../filter-popup/generic-filter-popup/generic-filter-popup.component';
import { Category, Format } from '../../../type/session/session';
import { SpeakerFilters } from '../../../type/speaker/speaker-filters';
import { FilterConfig } from '../../../type/components/filter.type';
import { GenericFilterService } from '../../services/generic-filter.service';

@Component({
  selector: 'app-speaker-filter-popup',
  imports: [
    GenericFilterPopupComponent
  ],
  templateUrl: './speaker-filter-popup.component.html',
  styleUrl: './speaker-filter-popup.component.scss'
})
export class SpeakerFilterPopupComponent implements OnInit {
  readonly availableFormats = input<Format[]>([]);
  readonly availableCategories = input<Category[]>([]);
  readonly currentFilters = input<SpeakerFilters>({
    selectedFormats: [],
    selectedCategories: [],
    hasCompleteTasks: null
  });

  readonly filtersApplied = output<SpeakerFilters>();
  readonly filtersReset = output<void>();
  readonly popupClosed = output<void>();

  private readonly filterService = inject(GenericFilterService);

  readonly filterConfig = computed<FilterConfig>(() => {
    return this.filterService.createStandardFilterConfig(
      this.availableFormats(),
      this.availableCategories(),
      'Speaker Filters',
      true,
      this.currentFilters()
    );
  });

  readonly currentFiltersForGeneric = computed<Record<string, any>>(() => {
    const filters = this.currentFilters();
    return {
      selectedFormats: [...filters.selectedFormats],
      selectedCategories: [...filters.selectedCategories],
      hasCompleteTasks: filters.hasCompleteTasks
    };
  });

  readonly filterSummary = computed(() => {
    const filters = this.currentFilters();
    return {
      formatCount: filters.selectedFormats.length,
      categoryCount: filters.selectedCategories.length,
      hasTaskFilter: filters.hasCompleteTasks !== null,
      totalActiveFilters: filters.selectedFormats.length +
        filters.selectedCategories.length +
        (filters.hasCompleteTasks !== null ? 1 : 0)
    };
  });

  constructor() {
    effect(() => {
      const summary = this.filterSummary();
      console.log('Filter summary updated:', summary);
    });
  }

  ngOnInit(): void {}

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
