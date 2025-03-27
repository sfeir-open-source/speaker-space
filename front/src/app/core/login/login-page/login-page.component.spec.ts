import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPageComponent } from './login-page.component';
import { Component } from '@angular/core';

@Component({
  selector: 'app-login-form',
  template: '<div>Mock Login Form</div>',
  standalone: true
})
class MockLoginFormComponent {}

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent, MockLoginFormComponent]
    })
      .overrideComponent(LoginPageComponent, {
        set: {
          imports: [MockLoginFormComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render login form component', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-login-form')).toBeTruthy();
  });
});
