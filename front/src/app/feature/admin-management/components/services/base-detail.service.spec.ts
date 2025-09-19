import { TestBed } from '@angular/core/testing';

import { BaseDetailService } from './base-detail.service';

describe('BaseDetailService', () => {
  let service: BaseDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BaseDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
