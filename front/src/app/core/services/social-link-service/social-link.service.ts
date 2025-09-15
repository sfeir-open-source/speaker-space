import { Injectable } from '@angular/core';
import {SocialLinkInfo} from '../../types/social-link-info';
import {SocialPlatformConfig} from '../../types/social-platform-config.type';

@Injectable({
  providedIn: 'root'
})
export class SocialLinkService {

  private readonly socialPlatforms: Record<string, SocialPlatformConfig> = {
    github: {
      domains: ['github.com', 'www.github.com'] as const,
      iconPath: 'assets/icons/social/github.svg',
      name: 'GitHub'
    },
    twitter: {
      domains: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'] as const,
      iconPath: 'assets/icons/social/twitter.svg',
      name: 'X (Twitter)'
    },
    linkedin: {
      domains: ['linkedin.com', 'www.linkedin.com'] as const,
      iconPath: 'assets/icons/social/linkedin.svg',
      name: 'LinkedIn'
    },
    bluesky: {
      domains: ['bsky.app', 'www.bsky.app'] as const,
      iconPath: 'assets/icons/social/bluesky.svg',
      name: 'Bluesky'
    }
  } as const;

  private readonly defaultIconPath = 'assets/icons/social/default-link.svg';

  private getDefaultLinkInfo(url: string, urlObj?: URL): SocialLinkInfo {
    const displayUrl :string = urlObj ? this.getDisplayUrl(urlObj) : url.replace(/^https?:\/\//, '');

    return {
      platform: 'Website',
      iconSvg: this.defaultIconPath,
      displayUrl,
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

      const platformEntry = Object.entries(this.socialPlatforms)
        .find(([, config]) =>
          config.domains.some(d => domain === d || domain.endsWith('.' + d))
        );

      if (platformEntry) {
        const [, config] = platformEntry;
        return {
          platform: config.name,
          iconSvg: config.iconPath,
          displayUrl: this.getDisplayUrl(urlObj),
          fullUrl: normalizedUrl
        };
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
