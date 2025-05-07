import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamEventPageComponent } from './team-event-page.component';

describe('TeamPageComponent', () => {
  let component: TeamEventPageComponent;
  let fixture: ComponentFixture<TeamEventPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamEventPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamEventPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
