import { Component, computed, inject } from '@angular/core';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { SessionImportData } from '../../type/session/session';
import {BaseListService} from '../services/list/base-list.service';

@Component({
  selector: 'app-pagination-list',
  imports: [ButtonComponent],
  templateUrl: './pagination-list.component.html',
  standalone: true,
  styleUrl: './pagination-list.component.scss'
})
export class PaginationListComponent {
  readonly listService = inject(BaseListService<SessionImportData>);
  private readonly pagination = this.listService.paginationService;

  readonly pageNumbers = computed(() => this.pagination.getPageNumbers());
  readonly currentPage = computed(() => this.pagination.currentPageSignal());
  readonly itemsPerPage = computed(() => this.pagination.itemsPerPageSignal());
  readonly totalElement = computed(() => this.pagination.totalItemsSignal());
  readonly totalPages = computed(() => this.pagination.totalPagesSignal());

  readonly paginationInfo = computed(() => {
    const current = this.currentPage();
    const itemsPerPageValue = this.itemsPerPage();
    const total = this.totalElement();

    return {
      start: (current - 1) * itemsPerPageValue + 1,
      end: Math.min(current * itemsPerPageValue, total),
      total
    };
  });

  readonly canGoToPreviousPage = computed(() => {
    const canGo = this.currentPage() > 1;
    return canGo;
  });

  readonly canGoToNextPage = computed(() => {
    const canGo = this.currentPage() < this.totalPages();
    return canGo;
  });

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pagination.goToPage(page);
  }

  goToPreviousPage(): void {
    if (this.canGoToPreviousPage()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  goToNextPage(): void {
    if (this.canGoToNextPage()) {
      this.goToPage(this.currentPage() + 1);
    }
  }
}
