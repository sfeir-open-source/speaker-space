import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingTeamPageComponent } from './setting-team-page.component';

describe('SettingTeamPageComponent', () => {
  let component: SettingTeamPageComponent;
  let fixture: ComponentFixture<SettingTeamPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingTeamPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingTeamPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
