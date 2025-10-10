import { TestBed } from '@angular/core/testing';

import { SpeakerValidationService } from './speaker-validation.service';

describe('SpeakerValidationService', () => {
  let service: SpeakerValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeakerValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
