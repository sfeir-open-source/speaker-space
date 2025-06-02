export interface FormField {
  isRequired?: boolean;
  minLength?: number;
  name: string;
  label?: string;
  paragraph?: string;
  placeholder?: string;
  type: string;
  required?: boolean;
  value?: string;
  helpText?: string;
  errorMessage?: string;
  disabled?: boolean;
  rows?: number;
  icon?: string;
  iconPath?: string;
  staticPlaceholder?: string;
  options?: { value: string; label: string }[];
}
