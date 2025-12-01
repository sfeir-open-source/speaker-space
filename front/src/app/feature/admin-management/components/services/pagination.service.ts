import { computed, Injectable, signal } from '@angular/core';

@Injectable()
export class PaginationService<T> {
  private readonly _currentPageSignal = signal<number>(1);
  private readonly _filteredItemsSignal = signal<T[]>([]);
  readonly itemsPerPageSignal = signal<number>(10);
  readonly totalPagesSignal = signal<number>(0);
  readonly totalItemsSignal = signal<number>(0);

  readonly currentPageSignal = computed(() => this._currentPageSignal());

  readonly paginatedItemsSignal = computed(() => {
    const currentPage = this._currentPageSignal();
    const filteredItems = this._filteredItemsSignal();
    const itemsPerPage = this.itemsPerPageSignal();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const result = filteredItems.slice(startIndex, endIndex);

    return result;
  });

  setItems(items: T[]): void {
    this._filteredItemsSignal.set([...items]);
    this.totalItemsSignal.set(items.length);
    this._currentPageSignal.set(1);
    this.calculateTotalPages();
  }

  updateFilteredItems(filteredItems: T[]): void {
    this._filteredItemsSignal.set(filteredItems);
    this.totalItemsSignal.set(filteredItems.length);
    this._currentPageSignal.set(1);
    this.calculateTotalPages();
  }

  goToPage(page: number): void {
    const totalPages = this.totalPagesSignal();
    const currentPage = this._currentPageSignal();

    if (!Number.isInteger(page) || page < 1 || page > totalPages) {
      return;
    }

    if (page === currentPage) {
      return;
    }

    this._currentPageSignal.set(page);
  }

  getPageNumbers(): number[] {
    const currentPage = this._currentPageSignal();
    const totalPages = this.totalPagesSignal();
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  reset(): void {
    this._currentPageSignal.set(1);
    this._filteredItemsSignal.set([]);
    this.totalItemsSignal.set(0);
    this.totalPagesSignal.set(0);
  }

  getPaginatedItems(): T[] {
    return this.paginatedItemsSignal();
  }

  private calculateTotalPages(): void {
    const totalItems = this.totalItemsSignal();
    const itemsPerPage = this.itemsPerPageSignal();
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    this.totalPagesSignal.set(totalPages);
  }
}
