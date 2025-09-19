import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarSpeakerPageComponent } from './navbar-speaker-page.component';

describe('NavbarTeamPageComponent', () => {
  let component: NavbarSpeakerPageComponent;
  let fixture: ComponentFixture<NavbarSpeakerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarSpeakerPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarSpeakerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
