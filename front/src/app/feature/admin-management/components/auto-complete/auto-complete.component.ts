import { Component, input, output, TemplateRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auto-complete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './auto-complete.component.html',
  styleUrl: './auto-complete.component.scss'
})
export class AutocompleteComponent<T> {
  control = input.required<FormControl>();
  results = input<T[]>([]);
  isLoading = input<boolean>(false);
  placeholder = input<string>('');
  icon = input<string>('search');
  itemTemplate = input.required<TemplateRef<any>>();
  trackBy = input<(item: T) => any>((item: T) => item);

  itemSelected = output<T>();
  focused = output<void>();
  blurred = output<void>();
  inputChanged = output<string>();

  showResults: boolean = false;

  selectItem(item: T): void {
    this.itemSelected.emit(item);
    this.showResults = false;
  }

  onFocus(): void {
    this.showResults = true;
    this.focused.emit();
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.showResults = value.length >= 2;
    this.inputChanged.emit(value);
  }

  shouldShowNoResults(): boolean {
    const currentControl = this.control();
    const currentResults = this.results();
    const currentIsLoading = this.isLoading();

    return this.showResults &&
      currentControl.value &&
      currentControl.value.length > 0 &&
      !currentIsLoading &&
      currentResults.length === 0;
  }
}
