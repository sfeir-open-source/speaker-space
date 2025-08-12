import { TestBed } from '@angular/core/testing';

import { SpeakerMapperService } from './speaker-mapper.service';

describe('SpeakerMapperService', () => {
  let service: SpeakerMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeakerMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
