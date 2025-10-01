import { TestBed } from '@angular/core/testing';

import { EventDataMapperService } from './event-data-mapper.service';

describe('EventDataMapperService', () => {
  let service: EventDataMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventDataMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
