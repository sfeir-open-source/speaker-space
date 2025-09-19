import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarEventPageComponent } from './navbar-event-page.component';

describe('NavbarTeamPageComponent', () => {
  let component: NavbarEventPageComponent;
  let fixture: ComponentFixture<NavbarEventPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarEventPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarEventPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
