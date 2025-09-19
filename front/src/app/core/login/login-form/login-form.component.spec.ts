import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginFormComponent } from './login-form.component';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonWithIconComponent } from "../../../shared/button-with-icon/button-with-icon.component";
import { MatDialog } from '@angular/material/dialog';
import { AuthErrorDialogComponent } from '../../../shared/auth-error-dialog/auth-error-dialog.component';
import { of } from 'rxjs';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;
  let authServiceMock: any;
  let routerMock: any;
  let dialogMock: any;
  let originalLocation: Location;
  let originalSessionStorage: Storage;
  let originalPrompt: any;

  beforeEach(async () => {
    originalLocation = window.location;
    originalSessionStorage = window.sessionStorage;
    originalPrompt = window.prompt;

    window.prompt = jest.fn();

    authServiceMock = {
      loginWithGoogle: jest.fn().mockResolvedValue({}),
      loginWithGitHub: jest.fn().mockResolvedValue({}),
      loginWithEmail: jest.fn().mockResolvedValue({}),
      isSignInWithEmailLink: jest.fn().mockReturnValue(false),
      confirmSignIn: jest.fn().mockResolvedValue({}),
      dialog: {
        open: jest.fn().mockReturnValue({
          afterClosed: () => of(true)
        })
      }
    };

    routerMock = {
      navigate: jest.fn()
    };

    dialogMock = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of(true)
      })
    };

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        LoginFormComponent,
        ButtonWithIconComponent
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: MatDialog, useValue: dialogMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    window.prompt = originalPrompt;

    jest.clearAllMocks();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize with email from sessionStorage', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockImplementation(() => 'test@example.com');

    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:4200',
        search: ''
      },
      writable: true
    });

    component.ngOnInit();
    expect(component.email).toBe('test@example.com');

    getItemSpy.mockRestore();
  });

  it('should handle email sign-in if URL contains email link', () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:4200?apiKey=123',
        search: ''
      },
      writable: true
    });

    authServiceMock.isSignInWithEmailLink.mockReturnValue(true);

    const handleEmailSignInSpy = jest.spyOn(component as any, 'handleEmailSignIn');
    handleEmailSignInSpy.mockImplementation(() => {});

    component.ngOnInit();

    expect(authServiceMock.isSignInWithEmailLink).toHaveBeenCalledWith('http://localhost:4200?apiKey=123');
    expect(handleEmailSignInSpy).toHaveBeenCalled();

    handleEmailSignInSpy.mockRestore();
  });

  it('should show email modal if URL parameters indicate it', () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:4200?showEmailModal=true&email=test@example.com',
        search: '?showEmailModal=true&email=test@example.com'
      },
      writable: true
    });

    const removeClassMock = jest.fn();

    document.getElementById = jest.fn().mockImplementation((id) => {
      if (id === 'crud-modal') {
        return {
          classList: {
            remove: removeClassMock
          }
        };
      }
      return null;
    });

    component.ngOnInit();

    expect(component.email).toBe('test@example.com');

    expect(document.getElementById).toHaveBeenCalledWith('crud-modal');

    expect(removeClassMock).toHaveBeenCalledWith('hidden');
  });


  it('should call loginWithGoogle when googleLogin is called', () => {
    component.googleLogin();
    expect(authServiceMock.loginWithGoogle).toHaveBeenCalled();
  });

  it('should call loginWithGitHub when gitHubLogin is called', () => {
    component.gitHubLogin();
    expect(authServiceMock.loginWithGitHub).toHaveBeenCalled();
  });

  it('should call loginWithEmail when mailLinkLogin is called with valid email', () => {
    component.mailLinkLogin('test@example.com');
    expect(authServiceMock.loginWithEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('should show error dialog when mailLinkLogin is called without email', () => {
    component.mailLinkLogin('');

    expect(authServiceMock.dialog.open).toHaveBeenCalled();

    const callArgs = authServiceMock.dialog.open.mock.calls[0];
    expect(callArgs[0]).toBe(AuthErrorDialogComponent);
    expect(callArgs[1].width).toBe('400px');
    expect(callArgs[1].data.title).toBe('Error');
    expect(callArgs[1].data.message).toBe('Please enter a valid email address.');

    expect(authServiceMock.loginWithEmail).not.toHaveBeenCalled();
  });

  it('should handle email sign-in with email from sessionStorage', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockImplementation(() => 'test@example.com');

    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:4200?apiKey=123',
        search: ''
      },
      writable: true
    });

    (component as any).handleEmailSignIn();

    expect(authServiceMock.confirmSignIn).toHaveBeenCalledWith(
      'test@example.com',
      'http://localhost:4200?apiKey=123'
    );

    getItemSpy.mockRestore();
  });

  it('should handle email sign-in with email from URL parameters', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockImplementation(() => null);

    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:4200?apiKey=123&email=url@example.com',
        search: '?apiKey=123&email=url@example.com'
      },
      writable: true
    });

    (component as any).handleEmailSignIn();

    expect(authServiceMock.confirmSignIn).toHaveBeenCalledWith(
      'url@example.com',
      'http://localhost:4200?apiKey=123&email=url@example.com'
    );

    getItemSpy.mockRestore();
  });

  it('should handle email sign-in with prompt if no email is found', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockImplementation(() => null);

    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:4200?apiKey=123',
        search: '?apiKey=123'
      },
      writable: true
    });

    (window.prompt as jest.Mock).mockReturnValue('prompt@example.com');

    (component as any).handleEmailSignIn();

    expect(window.prompt).toHaveBeenCalledWith('Please enter your email for confirmation');
    expect(authServiceMock.confirmSignIn).toHaveBeenCalledWith(
      'prompt@example.com',
      'http://localhost:4200?apiKey=123'
    );

    getItemSpy.mockRestore();
  });

  it('should not call confirmSignIn if prompt returns null', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockImplementation(() => null);

    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:4200?apiKey=123',
        search: '?apiKey=123'
      },
      writable: true
    });

    (window.prompt as jest.Mock).mockReturnValue(null);

    (component as any).handleEmailSignIn();

    expect(window.prompt).toHaveBeenCalledWith('Please enter your email for confirmation');
    expect(authServiceMock.confirmSignIn).not.toHaveBeenCalled();

    getItemSpy.mockRestore();
  });
});
