import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerFormFieldsComponent } from './speaker-form-fields.component';

describe('SpeakerFormFieldsComponent', () => {
  let component: SpeakerFormFieldsComponent;
  let fixture: ComponentFixture<SpeakerFormFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeakerFormFieldsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeakerFormFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
