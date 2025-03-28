import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamSidebarComponent } from './team-sidebar.component';

describe('ProfileSidebarComponent', () => {
  let component: TeamSidebarComponent;
  let fixture: ComponentFixture<TeamSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
