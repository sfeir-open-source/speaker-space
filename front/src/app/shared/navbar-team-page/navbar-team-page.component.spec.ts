import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarTeamPageComponent } from './navbar-team-page.component';

describe('NavbarTeamPageComponent', () => {
  let component: NavbarTeamPageComponent;
  let fixture: ComponentFixture<NavbarTeamPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarTeamPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarTeamPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
