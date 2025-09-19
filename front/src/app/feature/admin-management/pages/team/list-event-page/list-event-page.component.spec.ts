import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListEventPageComponent } from './list-event-page.component';

describe('TeamPageComponent', () => {
  let component: ListEventPageComponent;
  let fixture: ComponentFixture<ListEventPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListEventPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListEventPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
