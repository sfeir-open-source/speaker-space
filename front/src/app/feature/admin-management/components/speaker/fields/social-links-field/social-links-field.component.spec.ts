import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialLinksFieldComponent } from './social-links-field.component';

describe('SocialLinksFieldComponent', () => {
  let component: SocialLinksFieldComponent;
  let fixture: ComponentFixture<SocialLinksFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialLinksFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocialLinksFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
