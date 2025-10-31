import { TestBed } from '@angular/core/testing';

import { FieldImportService } from './field-import.service';

describe('BaseImportService', () => {
  let service: FieldImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FieldImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
