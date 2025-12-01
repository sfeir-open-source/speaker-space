import { TestBed } from '@angular/core/testing';

import { TeamManagementService } from './team-management.service';

describe('TeamManagementService', () => {
  let service: TeamManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeamManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
