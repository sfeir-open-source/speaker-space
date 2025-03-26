export interface FormField {
  name: string;
  label: string;
  placeholder: string;
  type: string;
  required?: boolean;
  value?: string;
  helpText?: string;
  errorMessage?: string;
  disabled?: boolean;
  rows?: number;
  icon?: string;
}
