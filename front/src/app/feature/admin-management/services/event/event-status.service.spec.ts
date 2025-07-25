import { TestBed } from '@angular/core/testing';

import { EventStatusService } from './event-status.service';

describe('EventStatusService', () => {
  let service: EventStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
