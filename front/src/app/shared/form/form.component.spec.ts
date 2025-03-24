import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FormComponent } from './form.component';
import { ActionButtonComponent } from '../action-button/action-button.component';
import { FormField } from './interface/form-field';

describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  const mockFields: FormField[] = [
    {
      name: 'testField',
      label: 'Test Field',
      placeholder: 'Enter test value',
      type: 'text',
      required: true
    },
    {
      name: 'optionalField',
      label: 'Optional Field',
      placeholder: 'Optional',
      type: 'text',
      required: false
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormComponent,
        ReactiveFormsModule,
        ActionButtonComponent
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;

    component.fields = mockFields;
    component.title = 'Test Form';
    component.description = 'Test Description';
    component.buttonName = 'Submit Test';

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create form controls based on input fields', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('testField')).toBeTruthy();
    expect(component.form.get('optionalField')).toBeTruthy();
  });

  it('should mark required fields with validators', () => {
    const testFieldControl = component.form.get('testField');
    const optionalFieldControl = component.form.get('optionalField');

    testFieldControl?.setValue('');
    expect(testFieldControl?.valid).toBeFalsy();

    optionalFieldControl?.setValue('');
    expect(optionalFieldControl?.valid).toBeTruthy();
  });

  it('should display error message for invalid required fields after touch', () => {
    const testFieldControl = component.form.get('testField');
    testFieldControl?.setValue('');
    testFieldControl?.markAsTouched();
    fixture.detectChanges();

    const errorMessage = fixture.debugElement.query(By.css('.text-red-600'));
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.nativeElement.textContent).toContain('This field is required');
  });

  it('should render title and description correctly', () => {
    const titleElement = fixture.debugElement.query(By.css('h1')).nativeElement;
    const descriptionElement = fixture.debugElement.query(By.css('p')).nativeElement;

    expect(titleElement.textContent.trim()).toBe('Test Form');
    expect(descriptionElement.textContent.trim()).toBe('Test Description');
  });

  it('should call onSubmit method when form is submitted', () => {
    const submitSpy = jest.spyOn(component, 'onSubmit');

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('submit', null);

    expect(submitSpy).toHaveBeenCalled();
  });

  it('should mark all fields as touched when submitting invalid form', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    component.form.get('testField')?.setValue('');

    component.onSubmit();

    expect(component.form.get('testField')?.touched).toBeTruthy();
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should log form values when submitting valid form', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    component.form.get('testField')?.setValue('test value');

    component.onSubmit();

    expect(consoleSpy).toHaveBeenCalledWith('Form submitted:', expect.any(Object));

    consoleSpy.mockRestore();
  });
});
