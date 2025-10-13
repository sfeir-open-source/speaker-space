import {Component, computed, EventEmitter, input, Input, output, Output} from '@angular/core';
import {Category, Format} from '../../../../type/session/session';

@Component({
  selector: 'app-session-categories-formats-field',
  imports: [],
  templateUrl: './session-categories-formats-field.component.html',
  standalone: true,
  styleUrl: './session-categories-formats-field.component.scss'
})

export class SessionCategoriesFormatsFieldComponent {
  availableFormats = input<Format[]>([]);
  availableCategories = input<Category[]>([]);
  selectedFormats = input<string[]>([]);
  selectedCategories = input<string[]>([]);

  formatsChange = output<string[]>();
  categoriesChange = output<string[]>();

  hasFormats = computed(() => this.availableFormats().length > 0);
  hasCategories = computed(() => this.availableCategories().length > 0);

  onFormatChange(formatId: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    const updatedFormats = isChecked
      ? [...this.selectedFormats(), formatId]
      : this.selectedFormats().filter(id => id !== formatId);

    this.formatsChange.emit(updatedFormats);
  }

  onCategoryChange(categoryId: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    const updatedCategories = isChecked
      ? [...this.selectedCategories(), categoryId]
      : this.selectedCategories().filter(id => id !== categoryId);

    this.categoriesChange.emit(updatedCategories);
  }
}
