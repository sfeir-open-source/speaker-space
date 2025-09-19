import { TestBed } from '@angular/core/testing';

import { GenericFilterService } from './generic-filter.service';

describe('GenericFilterService', () => {
  let service: GenericFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GenericFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
