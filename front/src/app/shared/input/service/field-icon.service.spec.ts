import { TestBed } from '@angular/core/testing';

import { FieldIconService } from './field-icon.service';

describe('FieldIconService', () => {
  let service: FieldIconService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FieldIconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
