import { TestBed } from '@angular/core/testing';
import { UserDataService } from './user-data.service';

describe('UserDataService', () => {
  let service: UserDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with sidebar closed', () => {
    expect(service.isSidebarOpen).toBeFalsy();
    expect(service.userName).toBeNull();
    expect(service.userPhotoURL).toBeNull();
    expect(service.userEmail).toBeNull();
  });

  it('should open sidebar without user data', () => {
    service.toggleSidebar(true);

    expect(service.isSidebarOpen).toBeTruthy();
    expect(service.userName).toBeNull();
    expect(service.userPhotoURL).toBeNull();
    expect(service.userEmail).toBeNull();
  });

  it('should open sidebar with user data', () => {
    const mockUser = {
      displayName: 'Test User',
      photoURL: 'test-photo.jpg',
      email: 'test@example.com'
    };

    service.toggleSidebar(true, mockUser);

    expect(service.isSidebarOpen).toBeTruthy();
    expect(service.userName).toBe('Test User');
    expect(service.userPhotoURL).toBe('test-photo.jpg');
    expect(service.userEmail).toBe('test@example.com');
  });

  it('should handle user without displayName', () => {
    const mockUser = {
      email: 'test@example.com'
    };

    service.toggleSidebar(true, mockUser);

    expect(service.userName).toBe('test@example.com');
    expect(service.userPhotoURL).toBe('img/profil-picture.svg');
    expect(service.userEmail).toBe('test@example.com');
  });

  it('should close sidebar', () => {
    service.toggleSidebar(true, { displayName: 'Test User' });
    expect(service.isSidebarOpen).toBeTruthy();

    service.toggleSidebar(false);
    expect(service.isSidebarOpen).toBeFalsy();
    expect(service.userName).toBe('Test User');
  });
});
