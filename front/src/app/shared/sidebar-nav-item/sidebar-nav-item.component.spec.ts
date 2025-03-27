import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarNavItemComponent } from './sidebar-nav-item.component';
import { By } from '@angular/platform-browser';

describe('SidebarNavItemComponent', () => {
  let component: SidebarNavItemComponent;
  let fixture: ComponentFixture<SidebarNavItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarNavItemComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SidebarNavItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display material icon when provided', () => {
    component.materialIcon = 'home';
    fixture.detectChanges();

    const iconElement = fixture.debugElement.query(By.css('.material-symbols-outlined'));
    expect(iconElement).toBeTruthy();
    expect(iconElement.nativeElement.textContent.trim()).toBe('home');
  });

  it('should show notification indicator when hasNotification is true', () => {
    component.materialIcon = 'notifications';
    component.hasNotification = true;
    fixture.detectChanges();

    const notificationElement = fixture.debugElement.query(By.css('.absolute.bg-primaryColor'));
    expect(notificationElement).toBeTruthy();
  });

  it('should not show notification indicator when hasNotification is false', () => {
    component.materialIcon = 'notifications';
    component.hasNotification = false;
    fixture.detectChanges();

    const notificationElement = fixture.debugElement.query(By.css('.absolute.bg-primaryColor'));
    expect(notificationElement).toBeFalsy();
  });

  it('should emit itemClick event with route when navigate() is called', () => {
    const routePath = '/test-route';
    component.route = routePath;

    const spy = jest.spyOn(component.itemClick, 'emit');
    component.navigate();

    expect(spy).toHaveBeenCalledWith(routePath);
  });

  it('should call buttonHandler when provided and button is clicked', () => {
    const handlerFn = jest.fn();
    component.buttonHandler = handlerFn;

    component.handleButtonClick();

    expect(handlerFn).toHaveBeenCalled();
  });

  it('should emit route when no buttonHandler is provided but route exists', () => {
    component.route = '/test-route';
    component.buttonHandler = null;

    const spy = jest.spyOn(component.itemClick, 'emit');
    component.handleButtonClick();

    expect(spy).toHaveBeenCalledWith('/test-route');
  });

  it('should trigger handleButtonClick when button is clicked', () => {
    const spy = jest.spyOn(component, 'handleButtonClick');

    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalled();
  });

  it('should render ng-content correctly', () => {
    const buttonDE = fixture.debugElement.query(By.css('button'));
    buttonDE.nativeElement.innerHTML += '<span>Test Content</span>';

    fixture.detectChanges();

    expect(buttonDE.nativeElement.textContent).toContain('Test Content');
  });
});
