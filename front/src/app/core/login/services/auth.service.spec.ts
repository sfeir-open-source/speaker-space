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
});
