import { TestBed } from '@angular/core/testing';

import { BaseListService } from './base-list.service';

describe('BaseListService', () => {
  let service: BaseListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BaseListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
