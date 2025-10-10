import { TestBed } from '@angular/core/testing';

import { SpeakerRequestBuilderService } from './speaker-request-builder.service';

describe('SpeakerRequestBuilderService', () => {
  let service: SpeakerRequestBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeakerRequestBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
