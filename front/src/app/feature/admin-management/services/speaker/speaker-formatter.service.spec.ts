import { TestBed } from '@angular/core/testing';

import { SpeakerFormatterService } from './speaker-formatter.service';

describe('SpeakerFormatterService', () => {
  let service: SpeakerFormatterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeakerFormatterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
