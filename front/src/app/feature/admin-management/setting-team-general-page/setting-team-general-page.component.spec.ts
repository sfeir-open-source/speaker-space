import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingTeamGeneralPageComponent } from './setting-team-general-page.component';

describe('SettingTeamPageComponent', () => {
  let component: SettingTeamGeneralPageComponent;
  let fixture: ComponentFixture<SettingTeamGeneralPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingTeamGeneralPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingTeamGeneralPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
