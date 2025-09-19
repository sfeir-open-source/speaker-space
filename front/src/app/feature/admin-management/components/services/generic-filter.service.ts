import { Injectable } from '@angular/core';
import {SpeakerFilters} from '../../type/speaker/speaker-filters';
import {SessionFilters} from '../../type/session/session-filters';
import {ButtonConfig, DropdownConfig, FilterConfig} from '../../type/components/filter.type';
import {Category, Format} from '../../type/session/session';

@Injectable({
  providedIn: 'root'
})
export class GenericFilterService {

  createStandardFilterConfig(
    availableFormats: Format[],
    availableCategories: Category[],
    title: string = 'Filters',
    includeTaskStatus: boolean = false,
    currentFilters: any = {}
  ): FilterConfig {

    const dropdowns: DropdownConfig[] = [
      {
        id: 'selectedFormats',
        label: 'Formats',
        placeholder: 'Select formats',
        emptyMessage: 'No formats available',
        type: 'checkbox',
        options: availableFormats.map(format => ({
          id: format.id,
          name: format.name,
          description: format.description
        })),
        selectedValues: currentFilters.selectedFormats || []
      },
      {
        id: 'selectedCategories',
        label: 'Categories',
        placeholder: 'Select categories',
        emptyMessage: 'No categories available',
        type: 'checkbox',
        options: availableCategories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description
        })),
        selectedValues: currentFilters.selectedCategories || []
      }
    ];

    const buttons: ButtonConfig[] = [];

    if (includeTaskStatus) {
      buttons.push({
        id: 'hasCompleteTasks',
        label: 'Task Status',
        options: [
          {
            value: true,
            label: 'Complete Tasks',
            activeClass: 'rounded-md mr-5 text-sm inline-flex items-center gap-2 bg-action hover:bg-action text-white border border-green-900 cursor-pointer shadow-sm px-4 py-2',
            inactiveClass: 'rounded-md mr-5 text-sm inline-flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 cursor-pointer shadow-sm px-4 py-2 text-gray-600'
          },
          {
            value: false,
            label: 'Missing Tasks',
            activeClass: 'rounded-md mr-5 text-sm inline-flex items-center gap-2 bg-action hover:bg-action text-white border border-green-900 cursor-pointer shadow-sm px-4 py-2',
            inactiveClass: 'rounded-md mr-5 text-sm inline-flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 cursor-pointer shadow-sm px-4 py-2 text-gray-600'
          }
        ],
        selectedValue: currentFilters.hasCompleteTasks || null
      });
    }

    return {
      title,
      dropdowns,
      buttons
    };
  }

  convertToSessionFilters(genericFilters: Record<string, any>): SessionFilters {
    return {
      selectedFormats: genericFilters['selectedFormats'] || [],
      selectedCategories: genericFilters['selectedCategories'] || []
    };
  }

  convertToSpeakerFilters(genericFilters: Record<string, any>): SpeakerFilters {
    return {
      selectedFormats: genericFilters['selectedFormats'] || [],
      selectedCategories: genericFilters['selectedCategories'] || [],
      hasCompleteTasks: genericFilters['hasCompleteTasks'] !== undefined ?
        genericFilters['hasCompleteTasks'] : null
    };
  }
}

