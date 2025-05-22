jest.mock('@angular/fire/auth', () => {
  return {
    Auth: jest.fn().mockImplementation(() => ({
      currentUser: null,
      onAuthStateChanged: jest.fn()
    })),
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({
      providerId: 'google.com',
      addScope: jest.fn()
    })),
    GithubAuthProvider: jest.fn().mockImplementation(() => ({
      providerId: 'github.com',
      addScope: jest.fn()
    })),
    signInWithPopup: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
          emailVerified: true,
          isAnonymous: false,
          metadata: {},
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: jest.fn(),
          getIdToken: jest.fn().mockResolvedValue('mock-token'),
          getIdTokenResult: jest.fn(),
          reload: jest.fn(),
          toJSON: jest.fn()
        }
      });
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn((auth, callback) => {
      callback(null);
      return jest.fn();
    }),
    sendSignInLinkToEmail: jest.fn().mockResolvedValue(undefined),
    isSignInWithEmailLink: jest.fn().mockReturnValue(false),
    signInWithEmailLink: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
          emailVerified: true,
          isAnonymous: false,
          metadata: {},
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: jest.fn(),
          getIdToken: jest.fn().mockResolvedValue('mock-token'),
          getIdTokenResult: jest.fn(),
          reload: jest.fn(),
          toJSON: jest.fn()
        }
      });
    }),
    setPersistence: jest.fn().mockResolvedValue(undefined),
    fetchSignInMethodsForEmail: jest.fn().mockResolvedValue([]),
    browserLocalPersistence: 'browser',
    getAuth: jest.fn().mockReturnValue({
      currentUser: null,
      onAuthStateChanged: jest.fn()
    }),
    provideAuth: jest.fn().mockReturnValue({
      ngModule: class {},
      providers: []
    }),
    inject: jest.fn()
  };
});

import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { Auth, User } from '@angular/fire/auth';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';

const createMockUser = () => ({
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn().mockResolvedValue('mock-token'),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn()
} as unknown as User);

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  let mockDialog: any;
  let mockAuth: any;

  const firebaseMocks = jest.requireMock('@angular/fire/auth');

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth = {
      currentUser: null,
      onAuthStateChanged: jest.fn((callback) => {
        callback(null);
        return jest.fn();
      })
    };

    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of(undefined)
      })
    };

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        MatDialogModule
      ],
      providers: [
        AuthService,
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: Auth, useValue: mockAuth },
        {
          provide: FIREBASE_OPTIONS,
          useValue: { projectId: 'test-project' }
        }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loginWithGoogle', () => {
    it('should login with Google provider successfully', async () => {
      const mockUser = createMockUser();

      jest.spyOn(service, 'loginWithProvider').mockResolvedValue(mockUser);
      jest.spyOn(router, 'navigate');

      const result = await service.loginWithGoogle();

      expect(service.loginWithProvider).toHaveBeenCalledWith('google');
      expect(result).toEqual(mockUser);
    });
  });

  describe('loginWithGitHub', () => {
    it('should login with GitHub provider successfully', async () => {
      const mockUser = createMockUser();

      jest.spyOn(service, 'loginWithProvider').mockResolvedValue(mockUser);
      jest.spyOn(router, 'navigate');

      const result = await service.loginWithGitHub();

      expect(service.loginWithProvider).toHaveBeenCalledWith('github');
      expect(result).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should sign out successfully', (done) => {
      jest.spyOn(firebaseMocks, 'signOut').mockImplementation(() => Promise.resolve(undefined));
      jest.spyOn(service['http'], 'post').mockImplementation(() => of({ success: true }));

      service.logout().then(() => {
        expect(firebaseMocks.signOut).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        done();
      });
    }, 10000);
  });

  describe('loginWithEmail', () => {
    it('should send email link successfully', async () => {
      const email = 'test@example.com';

      jest.spyOn(service, 'loginWithProvider').mockResolvedValue(true);

      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:4200' },
        writable: true
      });

      const result = await service.loginWithEmail(email);

      expect(service.loginWithProvider).toHaveBeenCalledWith('email', email);
      expect(result).toBe(true);
    });
  });

  describe('loginWithProvider', () => {
    it('should use GoogleAuthProvider for google provider', async () => {
      const mockUser = createMockUser();

      firebaseMocks.signInWithPopup.mockImplementation(() => Promise.resolve({ user: mockUser }));
      firebaseMocks.fetchSignInMethodsForEmail.mockImplementation(() => Promise.resolve([]));

      const httpSpy = jest.spyOn(service['http'], 'post').mockImplementation(() => of({ success: true }));

      const result = await service.loginWithProvider('google');

      expect(firebaseMocks.GoogleAuthProvider).toHaveBeenCalled();
      expect(firebaseMocks.signInWithPopup).toHaveBeenCalled();
      expect(httpSpy).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockUser);
    });
  });

  describe('sendEmailLink', () => {
    it('should send email link and show dialog', async () => {
      const email = 'test@example.com';

      firebaseMocks.fetchSignInMethodsForEmail.mockImplementation(() => Promise.resolve([]));
      firebaseMocks.sendSignInLinkToEmail.mockImplementation(() => Promise.resolve(undefined));

      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:4200' },
        writable: true
      });

      const result = await service.sendEmailLink(email);

      expect(firebaseMocks.sendSignInLinkToEmail).toHaveBeenCalled();
      expect(mockDialog.open).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });


  describe('sendEmailLink', () => {
    it('should send email link and show dialog', async () => {
      const email = 'test@example.com';
      firebaseMocks.fetchSignInMethodsForEmail.mockResolvedValueOnce([]);
      firebaseMocks.sendSignInLinkToEmail.mockResolvedValueOnce(undefined);

      const result = await service.sendEmailLink(email);

      expect(firebaseMocks.sendSignInLinkToEmail).toHaveBeenCalled();
      expect(mockDialog.open).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
