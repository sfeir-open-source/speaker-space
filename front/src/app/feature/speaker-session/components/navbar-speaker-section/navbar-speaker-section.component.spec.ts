import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarSpeakerSectionComponent } from './navbar-speaker-section.component';

describe('NavbarTeamPageComponent', () => {
  let component: NavbarSpeakerSectionComponent;
  let fixture: ComponentFixture<NavbarSpeakerSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarSpeakerSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarSpeakerSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
