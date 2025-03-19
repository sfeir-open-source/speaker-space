import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuth: { currentUser: any };
  let mockRouter: { navigate: jest.Mock };

  beforeEach(() => {
    mockAuth = { currentUser: null };
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Auth, useValue: mockAuth },
        { provide: Router, useValue: mockRouter }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when user is logged in', () => {
    mockAuth.currentUser = { uid: '123' };

    const result = guard.canActivate();

    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login and return false when user is not logged in', () => {
    mockAuth.currentUser = null;

    const result = guard.canActivate();

    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
