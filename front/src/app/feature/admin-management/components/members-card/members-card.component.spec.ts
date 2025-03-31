import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembersCardComponent } from './members-card.component';

describe('MembersCardComponent', () => {
  let component: MembersCardComponent;
  let fixture: ComponentFixture<MembersCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembersCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembersCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
