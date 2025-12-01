import { Injectable, signal, computed } from '@angular/core';
import { Category, Format, Speaker } from '../../type/session/session';
import { SpeakerFilters } from '../../type/speaker/speaker-filters';
import { SpeakerWithSessionsDTO } from '../../type/speaker/speaker-with-sessions';
import { isDefined } from '../../../../shared/type/predicates';

@Injectable()
export class SpeakerFilterService {
  readonly availableFormats = signal<Format[]>([]);
  readonly availableCategories = signal<Category[]>([]);
  readonly currentFilters = signal<SpeakerFilters>({
    selectedFormats: [],
    selectedCategories: [],
    hasCompleteTasks: null
  });

  readonly hasActiveFilters = computed(() => {
    const filters = this.currentFilters();
    return filters.selectedFormats.length > 0 ||
      filters.selectedCategories.length > 0 ||
      filters.hasCompleteTasks !== null;
  });

  readonly activeFiltersCount = computed(() => {
    const filters = this.currentFilters();
    let count = 0;
    count += filters.selectedFormats.length;
    count += filters.selectedCategories.length;
    if (filters.hasCompleteTasks !== null) count += 1;
    return count;
  });

  extractFiltersFromSpeakers(speakersWithSessions: SpeakerWithSessionsDTO[]): void {
    this.availableFormats.set(this.extractUniqueFormats(speakersWithSessions));
    this.availableCategories.set(this.extractUniqueCategories(speakersWithSessions));
  }

  applyAllFilters(
    speakers: Speaker[],
    speakersWithSessions: SpeakerWithSessionsDTO[],
    searchTerm: string
  ): Speaker[] {
    let filtered = [...speakers];
    const filters = this.currentFilters();

    if (filters.selectedFormats.length > 0) {
      filtered = this.filterByFormats(filtered, speakersWithSessions, filters.selectedFormats);
    }

    if (filters.selectedCategories.length > 0) {
      filtered = this.filterByCategories(filtered, speakersWithSessions, filters.selectedCategories);
    }

    if (filters.hasCompleteTasks !== null) {
      filtered = this.filterByCompleteTasks(filtered, filters.hasCompleteTasks);
    }

    if (searchTerm.trim()) {
      filtered = this.filterBySearchTerm(filtered, searchTerm);
    }

    return filtered;
  }

  updateFilters(filters: SpeakerFilters): void {
    this.currentFilters.set(filters);
  }

  resetFilters(): void {
    this.currentFilters.set({
      selectedFormats: [],
      selectedCategories: [],
      hasCompleteTasks: null
    });
  }

  private extractUniqueFormats(speakersWithSessions: SpeakerWithSessionsDTO[]): Format[] {
    const formatMap = new Map<string, Format>();

    speakersWithSessions.forEach(speakerWithSessions => {
      speakerWithSessions.formats?.forEach(format => {
        if (format.id && !formatMap.has(format.id)) {
          formatMap.set(format.id, format);
        }
      });
    });

    return Array.from(formatMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private extractUniqueCategories(speakersWithSessions: SpeakerWithSessionsDTO[]): Category[] {
    const categoryMap = new Map<string, Category>();

    speakersWithSessions.forEach(speakerWithSessions => {
      speakerWithSessions.categories?.forEach(category => {
        if (category.id && !categoryMap.has(category.id)) {
          categoryMap.set(category.id, category);
        }
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private filterByFormats(
    speakers: Speaker[],
    speakersWithSessions: SpeakerWithSessionsDTO[],
    selectedFormats: string[]
  ): Speaker[] {
    return speakers.filter(speaker => {
      const speakerWithSessions = this.findSpeakerWithSessions(speaker, speakersWithSessions);

      if (!speakerWithSessions || !speakerWithSessions.formats) {
        return false;
      }

      return speakerWithSessions.formats.some(format =>
        selectedFormats.includes(format.id)
      );
    });
  }

  private filterByCategories(
    speakers: Speaker[],
    speakersWithSessions: SpeakerWithSessionsDTO[],
    selectedCategories: string[]
  ): Speaker[] {
    return speakers.filter(speaker => {
      const speakerWithSessions = this.findSpeakerWithSessions(speaker, speakersWithSessions);

      if (!speakerWithSessions || !speakerWithSessions.categories) {
        return false;
      }

      return speakerWithSessions.categories.some(category =>
        selectedCategories.includes(category.id)
      );
    });
  }

  private filterByCompleteTasks(speakers: Speaker[], hasCompleteTasks: boolean): Speaker[] {
    return speakers.filter(speaker => {
      const isComplete = isDefined(speaker.name && speaker.email && speaker.company && speaker.bio);
      return hasCompleteTasks ? isComplete : !isComplete;
    });
  }

  private filterBySearchTerm(speakers: Speaker[], searchTerm: string): Speaker[] {
    const searchLower = searchTerm.toLowerCase();

    return speakers.filter(speaker =>
      speaker.name?.toLowerCase().includes(searchLower) ||
      speaker.email?.toLowerCase().includes(searchLower) ||
      speaker.company?.toLowerCase().includes(searchLower) ||
      speaker.bio?.toLowerCase().includes(searchLower)
    );
  }

  private findSpeakerWithSessions(
    speaker: Speaker,
    speakersWithSessions: SpeakerWithSessionsDTO[]
  ): SpeakerWithSessionsDTO | undefined {
    return speakersWithSessions.find(
      sws => sws.speaker.email === speaker.email || sws.speaker.name === speaker.name
    );
  }
}
