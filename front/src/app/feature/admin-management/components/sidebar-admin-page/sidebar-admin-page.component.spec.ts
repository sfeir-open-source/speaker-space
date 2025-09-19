import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarAdminPageComponent } from './sidebar-admin-page.component';

describe('SidebarAdminPageComponent', () => {
  let component: SidebarAdminPageComponent;
  let fixture: ComponentFixture<SidebarAdminPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarAdminPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
