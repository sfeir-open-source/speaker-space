import { TestBed } from '@angular/core/testing';

import { SessionFormatService } from './session-format.service';

describe('SessionFormatService', () => {
  let service: SessionFormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionFormatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
