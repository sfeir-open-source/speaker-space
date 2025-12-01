import { TestBed } from '@angular/core/testing';

import { EventFormConfigService } from './event-form-config.service';

describe('EventFormConfigService', () => {
  let service: EventFormConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventFormConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
