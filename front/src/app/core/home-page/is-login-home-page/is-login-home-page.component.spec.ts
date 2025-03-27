import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IsLoginHomePageComponent } from './is-login-home-page.component';
import { By } from '@angular/platform-browser';

describe('IsLoginHomePageComponent', () => {
  let component: IsLoginHomePageComponent;
  let fixture: ComponentFixture<IsLoginHomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IsLoginHomePageComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(IsLoginHomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have "currents" as default active tab', () => {
    expect(component.activeTab).toBe('currents');
  });

  it('should change active tab when setActiveTab is called', () => {
    expect(component.activeTab).toBe('currents');

    component.setActiveTab('passed');

    expect(component.activeTab).toBe('passed');
  });
  it('should update UI when tab changes', () => {
    fixture.detectChanges();
    let currentsButton = fixture.debugElement.queryAll(By.css('button'))[0];
    let passedButton = fixture.debugElement.queryAll(By.css('button'))[1];

    expect(currentsButton.nativeElement.classList.contains('bg-white')).toBe(true);
    expect(passedButton.nativeElement.classList.contains('bg-white')).toBe(false);

    component.setActiveTab('passed');
    fixture.detectChanges();

    currentsButton = fixture.debugElement.queryAll(By.css('button'))[0];
    passedButton = fixture.debugElement.queryAll(By.css('button'))[1];
    expect(currentsButton.nativeElement.classList.contains('bg-white')).toBe(false);
    expect(passedButton.nativeElement.classList.contains('bg-white')).toBe(true);
  });

  it('should handle button clicks', () => {
    const spy = jest.spyOn(component, 'setActiveTab');

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    buttons[1].nativeElement.click();

    expect(spy).toHaveBeenCalledWith('passed');
  });

});
