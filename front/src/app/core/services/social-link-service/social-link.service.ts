import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SocialLinkInfo } from '../../types/social-link-info';
import { SocialPlatformConfig } from '../../types/social-platform-config.type';

@Injectable({
  providedIn: 'root'
})
export class SocialLinkService {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly svgCache = new Map<string, Observable<SafeHtml>>();

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

  loadSvgIcon(iconPath: string, size: string = '16'): Observable<SafeHtml> {
    const cacheKey = `${iconPath}_${size}`;

    if (this.svgCache.has(cacheKey)) {
      return this.svgCache.get(cacheKey)!;
    }

    const svgObservable = this.http.get(iconPath, { responseType: 'text' }).pipe(
      map((svgText: string) => {
        const modifiedSvg = svgText.replace(
          /<svg([^>]*)>/,
          `<svg$1 width="${size}" height="${size}" class="text-gray-600 fill-current">`
        );
        return this.sanitizer.bypassSecurityTrustHtml(modifiedSvg);
      }),
      shareReplay(1)
    );

    this.svgCache.set(cacheKey, svgObservable);
    return svgObservable;
  }

  parseSocialLinkWithIcon(url: string, iconSize: string = '16'): Observable<SocialLinkInfo & { iconContent: SafeHtml }> {
    const linkInfo = this.parseSocialLink(url);

    return this.loadSvgIcon(linkInfo.iconSvg, iconSize).pipe(
      map(iconContent => ({
        ...linkInfo,
        iconContent
      }))
    );
  }

  parseSocialLink(url: string): SocialLinkInfo {
    if (!url) {
      return this.getDefaultLinkInfo(url);
    }

    try {
      const normalizedUrl: string = this.normalizeUrl(url);
      const urlObj = new URL(normalizedUrl);
      const domain: string = urlObj.hostname.toLowerCase();

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

  private getDefaultLinkInfo(url: string, urlObj?: URL): SocialLinkInfo {
    const displayUrl: string = urlObj ? this.getDisplayUrl(urlObj) : url.replace(/^https?:\/\//, '');

    return {
      platform: 'Website',
      iconSvg: this.defaultIconPath,
      displayUrl,
      fullUrl: url
    };
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  private getDisplayUrl(urlObj: URL): string {
    let displayUrl: string = urlObj.hostname;

    if (urlObj.pathname && urlObj.pathname !== '/') {
      displayUrl += urlObj.pathname;
    }

    if (urlObj.search) {
      displayUrl += urlObj.search;
    }

    return displayUrl;
  }
}
