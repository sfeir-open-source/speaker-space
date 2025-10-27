import { TestBed } from '@angular/core/testing';

import { EventValidatorsService } from './event-validators.service';

describe('EventValidatorsService', () => {
  let service: EventValidatorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventValidatorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
