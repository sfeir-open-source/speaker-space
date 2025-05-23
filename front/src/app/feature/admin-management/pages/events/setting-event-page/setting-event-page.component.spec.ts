import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingEventPageComponent } from './setting-event-page.component';

describe('EventDetailPageComponent', () => {
  let component: SettingEventPageComponent;
  let fixture: ComponentFixture<SettingEventPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingEventPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingEventPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
