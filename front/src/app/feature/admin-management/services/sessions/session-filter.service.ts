import { Injectable, signal, computed } from '@angular/core';
import { Category, Format, SessionImportData } from '../../type/session/session';
import { SessionFilters } from '../../type/session/session-filters';

@Injectable()
export class SessionFilterService {
  readonly availableFormats = signal<Format[]>([]);
  readonly availableCategories = signal<Category[]>([]);
  readonly currentFilters = signal<SessionFilters>({
    selectedFormats: [],
    selectedCategories: []
  });

  readonly hasActiveFilters = computed(() => {
    const filters = this.currentFilters();
    return filters.selectedFormats.length > 0 || filters.selectedCategories.length > 0;
  });

  readonly activeFiltersCount = computed(() => {
    const filters = this.currentFilters();
    return filters.selectedFormats.length + filters.selectedCategories.length;
  });

  extractFiltersFromSessions(sessions: SessionImportData[]): void {
    this.availableFormats.set(this.extractUniqueFormats(sessions));
    this.availableCategories.set(this.extractUniqueCategories(sessions));
  }

  applyAllFilters(sessions: SessionImportData[], searchTerm: string): SessionImportData[] {
    let filtered = [...sessions];
    const filters = this.currentFilters();

    if (filters.selectedFormats.length > 0) {
      filtered = this.filterByFormats(filtered, filters.selectedFormats);
    }

    if (filters.selectedCategories.length > 0) {
      filtered = this.filterByCategories(filtered, filters.selectedCategories);
    }

    if (searchTerm.trim()) {
      filtered = this.filterBySearchTerm(filtered, searchTerm);
    }

    return filtered;
  }

  updateFilters(filters: SessionFilters): void {
    this.currentFilters.set(filters);
  }

  resetFilters(): void {
    this.currentFilters.set({
      selectedFormats: [],
      selectedCategories: []
    });
  }

  private extractUniqueFormats(sessions: SessionImportData[]): Format[] {
    const formatMap = new Map<string, Format>();

    sessions.forEach(session => {
      session.formats?.forEach(format => {
        if (format.id && !formatMap.has(format.id)) {
          formatMap.set(format.id, format);
        }
      });
    });

    return Array.from(formatMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private extractUniqueCategories(sessions: SessionImportData[]): Category[] {
    const categoryMap = new Map<string, Category>();

    sessions.forEach(session => {
      session.categories?.forEach(category => {
        if (category.id && !categoryMap.has(category.id)) {
          categoryMap.set(category.id, category);
        }
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private filterByFormats(sessions: SessionImportData[], selectedFormats: string[]): SessionImportData[] {
    return sessions.filter(session =>
      session.formats?.some(format => selectedFormats.includes(format.id))
    );
  }

  private filterByCategories(sessions: SessionImportData[], selectedCategories: string[]): SessionImportData[] {
    return sessions.filter(session =>
      session.categories?.some(category => selectedCategories.includes(category.id))
    );
  }

  private filterBySearchTerm(sessions: SessionImportData[], searchTerm: string): SessionImportData[] {
    const searchLower = searchTerm.toLowerCase();

    return sessions.filter(session =>
      session.title?.toLowerCase().includes(searchLower) ||
      session.abstract?.toLowerCase().includes(searchLower) ||
      session.speakers?.some(speaker => speaker.name?.toLowerCase().includes(searchLower))
    );
  }
}
