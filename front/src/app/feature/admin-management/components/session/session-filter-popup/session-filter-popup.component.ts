import {Component, computed, effect, input, output} from '@angular/core';
import {SessionFilters} from '../../../type/session/session-filters';
import {Category, Format} from '../../../type/session/session';
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
export class SessionFilterPopupComponent {
  readonly availableFormats = input<Format[]>([]);
  readonly availableCategories = input<Category[]>([]);
  readonly currentFilters = input<SessionFilters>({
    selectedFormats: [],
    selectedCategories: []
  });

  readonly filtersApplied = output<SessionFilters>();
  readonly filtersReset = output<void>();
  readonly popupClosed = output<void>();

  readonly filterConfig = computed(() =>
    this.filterService.createStandardFilterConfig(
      this.availableFormats(),
      this.availableCategories(),
      'Session Filters',
      true,
      this.currentFilters()
    )
  );

  readonly currentFiltersForGeneric = computed(() => ({
    selectedFormats: [...this.currentFilters().selectedFormats],
    selectedCategories: [...this.currentFilters().selectedCategories]
  }));

  constructor(private filterService: GenericFilterService) {
    effect(() => {
      console.log('Filters updated:', this.currentFilters());
    });
  }

  onFiltersApplied(genericFilters: Record<string, any>): void {
    const convertedFilters: SessionFilters =
      this.filterService.convertToSessionFilters(genericFilters);
    this.filtersApplied.emit(convertedFilters);
  }

  onFiltersReset(): void {
    this.filtersReset.emit();
  }

  onPopupClosed(): void {
    this.popupClosed.emit();
  }
}
