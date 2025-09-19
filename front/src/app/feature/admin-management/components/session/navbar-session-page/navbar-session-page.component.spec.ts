import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarSessionPageComponent } from './navbar-session-page.component';

describe('NavbarTeamPageComponent', () => {
  let component: NavbarSessionPageComponent;
  let fixture: ComponentFixture<NavbarSessionPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarSessionPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarSessionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
