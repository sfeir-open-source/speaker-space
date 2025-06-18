import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import {SocialLinkInfo} from '../../types/social-link-info';

@Injectable({
  providedIn: 'root'
})
export class SocialLinkService {

  constructor(private sanitizer: DomSanitizer) {}

  private socialPlatforms = {
    github: {
      domains: ['github.com', 'www.github.com'],
      iconSvg: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
    </svg>`,
      name: 'GitHub'
    },
    twitter: {
      domains: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
      iconSvg: `<svg width="16" height="16" viewBox="0 0 1200 1227" fill="currentColor">
      <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/>
    </svg>`,
      name: 'X (Twitter)'
    },
    linkedin: {
      domains: ['linkedin.com', 'www.linkedin.com'],
      iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>`,
      name: 'LinkedIn'
    },
    bluesky: {
      domains: ['bsky.app', 'www.bsky.app'],
      iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 01-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/>
    </svg>`,
      name: 'Bluesky'
    }
  };

  private getDefaultLinkInfo(url: string, urlObj?: URL): SocialLinkInfo {
    const displayUrl : string = urlObj ? this.getDisplayUrl(urlObj) : url.replace(/^https?:\/\//, '');

    const defaultIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
  </svg>`;

    return {
      platform: 'Website',
      iconSvg: this.sanitizer.bypassSecurityTrustHtml(defaultIcon),
      displayUrl: displayUrl,
      fullUrl: url
    };
  }

  parseSocialLink(url: string): SocialLinkInfo {
    if (!url) {
      return this.getDefaultLinkInfo(url);
    }

    try {
      const normalizedUrl : string = this.normalizeUrl(url);
      const urlObj = new URL(normalizedUrl);
      const domain : string = urlObj.hostname.toLowerCase();

      for (const [platform, config] of Object.entries(this.socialPlatforms)) {
        if (config.domains.some(d => domain === d || domain.endsWith('.' + d))) {
          return {
            platform: config.name,
            iconSvg: this.sanitizer.bypassSecurityTrustHtml(config.iconSvg),
            displayUrl: this.getDisplayUrl(urlObj),
            fullUrl: normalizedUrl
          };
        }
      }

      return this.getDefaultLinkInfo(normalizedUrl, urlObj);

    } catch (error) {
      return this.getDefaultLinkInfo(url);
    }
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  private getDisplayUrl(urlObj: URL): string {
    let displayUrl : string = urlObj.hostname;

    if (urlObj.pathname && urlObj.pathname !== '/') {
      displayUrl += urlObj.pathname;
    }

    if (urlObj.search) {
      displayUrl += urlObj.search;
    }

    return displayUrl;
  }
}
