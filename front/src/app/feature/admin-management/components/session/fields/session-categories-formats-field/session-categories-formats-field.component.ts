import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Category, Format} from '../../../../type/session/session';

@Component({
  selector: 'app-session-categories-formats-field',
  imports: [],
  templateUrl: './session-categories-formats-field.component.html',
  styleUrl: './session-categories-formats-field.component.scss'
})
export class SessionCategoriesFormatsFieldComponent {
  @Input() availableFormats: Format[] = [];
  @Input() availableCategories: Category[] = [];
  @Input() selectedFormats: string[] = [];
  @Input() selectedCategories: string[] = [];

  @Output() formatsChange = new EventEmitter<string[]>();
  @Output() categoriesChange = new EventEmitter<string[]>();

  onFormatChange(formatId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    let updatedFormats: string[];

    if (target.checked) {
      updatedFormats = [...this.selectedFormats, formatId];
    } else {
      updatedFormats = this.selectedFormats.filter(id => id !== formatId);
    }

    this.formatsChange.emit(updatedFormats);
  }

  onCategoryChange(categoryId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    let updatedCategories: string[];

    if (target.checked) {
      updatedCategories = [...this.selectedCategories, categoryId];
    } else {
      updatedCategories = this.selectedCategories.filter(id => id !== categoryId);
    }

    this.categoriesChange.emit(updatedCategories);
  }
}
