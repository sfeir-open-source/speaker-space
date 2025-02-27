import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginHomePageComponent } from './login-home-page.component';

describe('LoginHomePageComponent', () => {
  let component: LoginHomePageComponent;
  let fixture: ComponentFixture<LoginHomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginHomePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginHomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
