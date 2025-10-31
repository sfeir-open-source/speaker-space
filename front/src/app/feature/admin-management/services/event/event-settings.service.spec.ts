import { TestBed } from '@angular/core/testing';

import { EventSettingsService } from './event-settings.service';

describe('EventSettingsService', () => {
  let service: EventSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
