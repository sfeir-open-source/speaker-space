import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionCategoriesFormatsFieldComponent } from './session-categories-formats-field.component';

describe('SessionCategoriesFormatsFieldComponent', () => {
  let component: SessionCategoriesFormatsFieldComponent;
  let fixture: ComponentFixture<SessionCategoriesFormatsFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionCategoriesFormatsFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionCategoriesFormatsFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
