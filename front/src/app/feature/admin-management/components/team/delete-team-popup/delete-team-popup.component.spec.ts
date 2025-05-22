import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteTeamPopupComponent } from './delete-team-popup.component';

describe('DeleteTeamPopupComponent', () => {
  let component: DeleteTeamPopupComponent;
  let fixture: ComponentFixture<DeleteTeamPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteTeamPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteTeamPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
