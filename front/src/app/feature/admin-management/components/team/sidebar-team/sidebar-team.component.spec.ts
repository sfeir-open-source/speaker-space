import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarTeamComponent } from './sidebar-team.component';

describe('ProfileSidebarComponent', () => {
  let component: SidebarTeamComponent;
  let fixture: ComponentFixture<SidebarTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarTeamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
