import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IsLoginHomePageComponent } from './is-login-home-page.component';

describe('LoginHomePageComponent', () => {
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
});
