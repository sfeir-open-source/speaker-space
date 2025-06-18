import {SafeHtml} from '@angular/platform-browser';

export type SocialLinkInfo = {
  platform: string;
  iconSvg: SafeHtml;
  displayUrl: string;
  fullUrl: string;
}
