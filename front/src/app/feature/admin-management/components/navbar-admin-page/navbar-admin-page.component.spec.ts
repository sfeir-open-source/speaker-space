import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarAdminPageComponent } from './navbar-admin-page.component';

describe('NavbarAdminPageComponent', () => {
  let component: NavbarAdminPageComponent;
  let fixture: ComponentFixture<NavbarAdminPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarAdminPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
