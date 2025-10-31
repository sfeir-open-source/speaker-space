import { TestBed } from '@angular/core/testing';

import { AuthDialogService } from './auth-dialog.service';

describe('AuthDialogService', () => {
  let service: AuthDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
