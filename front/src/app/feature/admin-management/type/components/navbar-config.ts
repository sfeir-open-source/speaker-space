export type NavbarButton = {
  id: string;
  label: string;
  materialIcon: string;
  route?: string;
  handler?: () => void;
  isVisible?: boolean;
  cssClass?: string;
}

export type RightButtonConfig = {
  label: string;
  icon: string;
  handler: () => void;
  cssClass?: string;
}

export type NavbarConfig = {
  leftButtons: NavbarButton[];
  rightContent?: 'role' | 'custom-button' | null;
  rightButtonConfig?: RightButtonConfig;
}
