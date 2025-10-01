import { TestBed } from '@angular/core/testing';

import { SessionFormatterService } from './session-formatter.service';

describe('SessionFormatterService', () => {
  let service: SessionFormatterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionFormatterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
