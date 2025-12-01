import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventLogoUploaderComponent } from './event-logo-uploader.component';

describe('EventLogoUploaderComponent', () => {
  let component: EventLogoUploaderComponent;
  let fixture: ComponentFixture<EventLogoUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventLogoUploaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventLogoUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
