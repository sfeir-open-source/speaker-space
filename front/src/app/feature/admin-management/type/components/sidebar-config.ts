export type SidebarButton = {
  id: string;
  label: string;
  materialIcon: string;
  route: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  cssClass?: string;
}

export type SidebarConfig = {
  buttons: SidebarButton[];
  containerCssClass?: string;
}
