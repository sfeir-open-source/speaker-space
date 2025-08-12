import { TestBed } from '@angular/core/testing';

import { UserSpeakerNotificationService } from './user-speaker-notification.service';

describe('UserSpeakerNotificationService', () => {
  let service: UserSpeakerNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserSpeakerNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
