import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformationEventComponent } from './information-event.component';

describe('InformationEventPageComponent', () => {
  let component: InformationEventComponent;
  let fixture: ComponentFixture<InformationEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformationEventComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformationEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
