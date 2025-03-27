import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePageComponent } from './home-page.component';
import { AuthService } from '../login/services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { IsLoginHomePageComponent } from './is-login-home-page/is-login-home-page.component';
import { IsLogoutHomePageComponent } from './is-logout-home-page/is-logout-home-page-component';

class MockAuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  setUser(user: any) {
    this.userSubject.next(user);
  }
}

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;
  let authService: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent, IsLoginHomePageComponent, IsLogoutHomePageComponent],
      providers: [
        { provide: AuthService, useClass: MockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display logout page when user is not logged in', () => {
    authService.setUser(null);
    fixture.detectChanges();

    const logoutComponent = fixture.debugElement.query(By.directive(IsLogoutHomePageComponent));
    const loginComponent = fixture.debugElement.query(By.directive(IsLoginHomePageComponent));

    expect(logoutComponent).toBeTruthy();
    expect(loginComponent).toBeFalsy();
    expect(component.isUserLoggedIn).toBe(false);
    expect(component.displayName).toBeNull();
  });

  it('should display login page when user is logged in', () => {
    const mockUser = { displayName: 'Test User' };
    authService.setUser(mockUser);
    fixture.detectChanges();

    const loginComponent = fixture.debugElement.query(By.directive(IsLoginHomePageComponent));
    const logoutComponent = fixture.debugElement.query(By.directive(IsLogoutHomePageComponent));

    expect(loginComponent).toBeTruthy();
    expect(logoutComponent).toBeFalsy();
    expect(component.isUserLoggedIn).toBe(true);
    expect(component.displayName).toBe('Test User');
  });
});
