import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingTeamMembersPageComponent } from './setting-team-members-page.component';

describe('SettingTeamMembersPageComponent', () => {
  let component: SettingTeamMembersPageComponent;
  let fixture: ComponentFixture<SettingTeamMembersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingTeamMembersPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingTeamMembersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
