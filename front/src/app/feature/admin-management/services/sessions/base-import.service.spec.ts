import { TestBed } from '@angular/core/testing';

import { BaseImportService } from './base-import.service';

describe('BaseImportService', () => {
  let service: BaseImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BaseImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
