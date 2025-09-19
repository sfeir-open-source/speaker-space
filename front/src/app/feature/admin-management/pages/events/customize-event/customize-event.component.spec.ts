import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizeEventComponent } from './customize-event.component';

describe('CustomizeEventComponent', () => {
  let component: CustomizeEventComponent;
  let fixture: ComponentFixture<CustomizeEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomizeEventComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomizeEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
