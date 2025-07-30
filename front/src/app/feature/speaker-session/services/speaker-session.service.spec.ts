import { TestBed } from '@angular/core/testing';

import { SpeakerSessionService } from './speaker-session.service';

describe('SpeakerSessionService', () => {
  let service: SpeakerSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeakerSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
