import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
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
  @Input() control!: FormControl;
  @Input() results: T[] = [];
  @Input() isLoading : boolean = false;
  @Input() placeholder : string = '';
  @Input() icon : string = 'search';
  @Input() itemTemplate!: TemplateRef<any>;
  @Input() trackBy: (item: T) => any = (item: T) => item;

  @Output() itemSelected : EventEmitter<T> = new EventEmitter<T>();
  @Output() focused : EventEmitter<void> = new EventEmitter<void>();
  @Output() blurred : EventEmitter<void> = new EventEmitter<void>();
  @Output() inputChanged : EventEmitter<string>  = new EventEmitter<string>();

  showResults : boolean = false;

  selectItem(item: T): void {
    this.itemSelected.emit(item);
    this.showResults = false;
  }

  onFocus(): void {
    this.showResults = true;
    this.focused.emit();
  }

  onBlur(): void {
    setTimeout(() => {
      this.showResults = false;
      this.blurred.emit();
    }, 200);
  }

  onInputChange(event: Event): void {
    const value: string = (event.target as HTMLInputElement).value;
    this.showResults = value.length >= 2;
    this.inputChanged.emit(value);
  }
}
