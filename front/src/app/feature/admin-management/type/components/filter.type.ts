export type FilterOption = {
  id: string;
  name: string;
  description?: string;
}

export type DropdownConfig = {
  id: string;
  label: string;
  placeholder: string;
  emptyMessage: string;
  type: 'checkbox' | 'button';
  options: FilterOption[] | string[];
  selectedValues: string[];
}

export type ButtonConfig = {
  id: string;
  label: string;
  options: {
    value: boolean | null;
    label: string;
    activeClass: string;
    inactiveClass: string;
  }[];
  selectedValue: boolean | null;
}

export type FilterConfig = {
  title: string;
  dropdowns?: DropdownConfig[];
  buttons?: ButtonConfig[];
}
