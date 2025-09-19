import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CreateTeamPageComponent } from './create-team-page.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CreateTeamPageComponent', () => {
  let component: CreateTeamPageComponent;
  let fixture: ComponentFixture<CreateTeamPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateTeamPageComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CreateTeamPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form fields correctly', () => {
    expect(component.formFields.length).toBe(2);

    expect(component.formFields[0].name).toBe('teamName');
    expect(component.formFields[0].required).toBeTruthy();

    expect(component.formFields[1].name).toBe('teamUrl');
    expect(component.formFields[1].placeholder).toContain('https://speaker-space.io/team/');
  });

  it('should render the page title and description', () => {
    const titleElement = fixture.debugElement.query(By.css('h1')).nativeElement;
    const descriptionElement = fixture.debugElement.query(By.css('p')).nativeElement;

    expect(titleElement.textContent).toContain('Create a new team');
    expect(descriptionElement.textContent).toContain('Give a cool name to your team');
  });
});
