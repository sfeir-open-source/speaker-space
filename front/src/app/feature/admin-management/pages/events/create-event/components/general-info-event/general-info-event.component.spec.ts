import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralInfoEventComponent } from './general-info-event.component';

describe('CreateEventPageComponent', () => {
  let component: GeneralInfoEventComponent;
  let fixture: ComponentFixture<GeneralInfoEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralInfoEventComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralInfoEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
