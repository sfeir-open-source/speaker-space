import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamGeneralFormComponent } from './team-general-form.component';

describe('TeamGeneralFormComponent', () => {
  let component: TeamGeneralFormComponent;
  let fixture: ComponentFixture<TeamGeneralFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamGeneralFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamGeneralFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
