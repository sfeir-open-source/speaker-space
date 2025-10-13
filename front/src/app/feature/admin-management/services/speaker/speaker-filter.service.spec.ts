import { TestBed } from '@angular/core/testing';

import { SpeakerFilterService } from './speaker-filter.service';

describe('SpeakerFilterService', () => {
  let service: SpeakerFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeakerFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
