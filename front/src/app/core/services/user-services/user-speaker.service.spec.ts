import { TestBed } from '@angular/core/testing';

import { UserSpeakerService } from './user-speaker.service';

describe('UserSpeakerService', () => {
  let service: UserSpeakerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserSpeakerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
