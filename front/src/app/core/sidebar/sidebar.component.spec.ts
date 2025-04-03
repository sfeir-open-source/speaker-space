import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import {AuthService} from '../services/auth.service';
import {UserDataService} from '../services/user-data.service';

class MockSidebarNavItemComponent {}

class MockSidebarService {
  isSidebarOpen = false;
  userName: string | null = null;
  userPhotoURL: string | null = null;
  userEmail: string | null = null;

  toggleSidebar = jest.fn((open: boolean, user: any = null) => {
    this.isSidebarOpen = open;
    if (user) {
      this.userName = user.displayName || user.email;
      this.userPhotoURL = user.photoURL || 'img/profil-picture.svg';
      this.userEmail = user.email || 'No email';
    }
  });
}

class MockAuthService {
  logout = jest.fn();
}

class MockRouter {
  navigate = jest.fn();
  url = '/current-route';
  events = new Subject<any>();
}

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let userDataService: MockSidebarService;
  let authService: MockAuthService;
  let router: MockRouter;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, SidebarComponent],
      providers: [
        { provide: UserDataService, useClass: MockSidebarService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: Router, useClass: MockRouter }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    userDataService = TestBed.inject(UserDataService) as unknown as MockSidebarService;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    router = TestBed.inject(Router) as unknown as MockRouter;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current route', () => {
    component.ngOnInit();
    expect(component.currentRoute).toBe('/current-route');
  });

  it('should update currentRoute on NavigationEnd events', () => {
    component.ngOnInit();

    const navigationEndEvent = new NavigationEnd(1, '/new-route', '/new-route');
    router.events.next(navigationEndEvent);

    expect(component.currentRoute).toBe('/new-route');
  });

  it('should close sidebar when closeSidebar is called', () => {
    component.closeSidebar();
    expect(userDataService.toggleSidebar).toHaveBeenCalledWith(false);
  });

  it('should logout and close sidebar when logout is called', () => {
    component.logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(userDataService.toggleSidebar).toHaveBeenCalledWith(false);
  });

  it('should navigate to path and close sidebar when navigateTo is called', () => {
    component.navigateTo('/test-path');

    expect(router.navigate).toHaveBeenCalledWith(['/test-path']);
    expect(userDataService.toggleSidebar).toHaveBeenCalledWith(false);
  });

  it('should call createNewTeam and close sidebar', () => {
    const consoleSpy = jest.spyOn(console, 'log');

    component.createNewTeam();

    expect(consoleSpy).toHaveBeenCalledWith('Creating new team...');
    expect(userDataService.toggleSidebar).toHaveBeenCalledWith(false);

    consoleSpy.mockRestore();
  });

  it('should close sidebar when overlay is clicked', () => {
    const overlay = fixture.debugElement.query(By.css('section.fixed.inset-0'));
    overlay.triggerEventHandler('click', {});

    expect(userDataService.toggleSidebar).toHaveBeenCalledWith(false);
  });

  it('should stop propagation when main content is clicked', () => {
    const mainContent = fixture.debugElement.query(By.css('main'));
    const stopPropagationSpy = jest.fn();

    mainContent.triggerEventHandler('click', { stopPropagation: stopPropagationSpy });

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should display user information correctly', () => {
    userDataService.userName = 'Test User';
    userDataService.userEmail = 'test@example.com';
    userDataService.userPhotoURL = 'test-photo.jpg';
    userDataService.isSidebarOpen = true;

    fixture.detectChanges();

    const userName = fixture.debugElement.query(By.css('p.text-sm.font-medium'));
    const userEmail = fixture.debugElement.query(By.css('p.text-xs.text-gray-500'));
    const userPhoto = fixture.debugElement.query(By.css('img[alt="profile"]'));

    expect(userName.nativeElement.textContent.trim()).toBe('Test User');
    expect(userEmail.nativeElement.textContent.trim()).toBe('test@example.com');
    expect(userPhoto.properties['src']).toBe('test-photo.jpg');
  });

  it('should apply correct classes based on sidebar state', () => {
    userDataService.isSidebarOpen = false;
    fixture.detectChanges();

    let overlay = fixture.debugElement.query(By.css('section.fixed.inset-0'));
    let main = fixture.debugElement.query(By.css('main'));

    expect(overlay.classes['opacity-0']).toBeTruthy();
    expect(overlay.classes['opacity-100']).toBeFalsy();
    expect(overlay.classes['pointer-events-none']).toBeTruthy();
    expect(main.classes['translate-x-full']).toBeTruthy();
    expect(main.classes['translate-x-0']).toBeFalsy();

    userDataService.isSidebarOpen = true;
    fixture.detectChanges();

    overlay = fixture.debugElement.query(By.css('section.fixed.inset-0'));
    main = fixture.debugElement.query(By.css('main'));

    expect(overlay.classes['opacity-0']).toBeFalsy();
    expect(overlay.classes['opacity-100']).toBeTruthy();
    expect(overlay.classes['pointer-events-none']).toBeFalsy();
    expect(main.classes['translate-x-full']).toBeFalsy();
    expect(main.classes['translate-x-0']).toBeTruthy();
  });
});
