import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../login/services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

class MockAuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  setUser(user: any) {
    this.userSubject.next(user);
  }
}

class MockSidebarService {
  toggleSidebar = jest.fn();
}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authService: MockAuthService;
  let sidebarService: MockSidebarService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: MockSidebarService, useClass: MockSidebarService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    sidebarService = TestBed.inject(MockSidebarService) as unknown as MockSidebarService;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display logout version when user is not logged in', () => {
    authService.setUser(null);
    fixture.detectChanges();

    const loginButton = fixture.debugElement.query(By.css('a[href="/login"]'));
    expect(loginButton).toBeTruthy();

    const profileLink = fixture.debugElement.query(By.css('a[href="/profil"]'));
    expect(profileLink).toBeFalsy();

    expect(component.isUserLoggedIn).toBe(false);
    expect(component.displayName).toBeNull();
  });

  it('should display login version when user is logged in', () => {
    const mockUser = {
      displayName: 'Test User',
      photoURL: 'test-photo.jpg',
      email: 'test@example.com'
    };
    authService.setUser(mockUser);
    fixture.detectChanges();

    const profileLink = fixture.debugElement.query(By.css('a[href="/profil"]'));
    expect(profileLink).toBeTruthy();

    const loginButton = fixture.debugElement.query(By.css('a[href="/login"]'));
    expect(loginButton).toBeFalsy();

    expect(component.isUserLoggedIn).toBe(true);
    expect(component.displayName).toBe('Test User');
    expect(component.userPhotoURL).toBe('test-photo.jpg');
  });

  it('should handle image error correctly', () => {
    authService.setUser({ displayName: 'Test User' });
    fixture.detectChanges();

    const imgElement = fixture.debugElement.query(By.css('img[alt="Your profile picture"]'));
    const event = { target: { src: 'original-src.jpg' } };

    component.handlePictureError(event);

    expect(event.target.src).toBe('img/profil-picture.svg');
  });

  it('should open sidebar when profile button is clicked', () => {
    const mockUser = {
      displayName: 'Test User',
      photoURL: 'test-photo.jpg',
      email: 'test@example.com'
    };
    authService.setUser(mockUser);
    fixture.detectChanges();

    const profileButton = fixture.debugElement.query(By.css('button[aria-label="Open user menu"]'));
    profileButton.triggerEventHandler('click', null);

    expect(sidebarService.toggleSidebar).toHaveBeenCalledWith(true, {
      displayName: 'Test User',
      photoURL: 'test-photo.jpg',
      email: 'test@example.com'
    });
  });

  it('should show notification indicator when haveNotification is true', () => {
    authService.setUser({ displayName: 'Test User' });
    component.haveNotification = true;
    fixture.detectChanges();

    const notificationIndicator = fixture.debugElement.query(By.css('[aria-label="You have notifications"]'));
    expect(notificationIndicator).toBeTruthy();
  });

  it('should not show notification indicator when haveNotification is false', () => {
    authService.setUser({ displayName: 'Test User' });
    component.haveNotification = false;
    fixture.detectChanges();

    const notificationIndicator = fixture.debugElement.query(By.css('[aria-label="You have notifications"]'));
    expect(notificationIndicator).toBeFalsy();
  });
});
