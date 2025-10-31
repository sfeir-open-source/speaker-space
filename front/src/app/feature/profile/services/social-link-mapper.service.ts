import { Injectable, inject } from '@angular/core';
import { SocialPlatformKey, SocialLinkMapping } from '../../../core/models/user.model';
import {SocialLinkService} from '../../../core/services/social-link-service/social-link.service';

@Injectable({
  providedIn: 'root'
})
export class SocialLinkMapperService {
  private readonly socialLinkService = inject(SocialLinkService);

  mapUrlsToPlatforms(urls: string[]): SocialLinkMapping {
    const mapping: SocialLinkMapping = {};
    const usedPlatforms = new Set<SocialPlatformKey>();

    const validUrls = urls.filter(url => url && url.trim() !== '');

    validUrls.forEach(url => {
      const linkInfo = this.socialLinkService.parseSocialLink(url);
      const platformKey = this.getPlatformKey(linkInfo.platform);

      if (!usedPlatforms.has(platformKey)) {
        mapping[platformKey] = url;
        usedPlatforms.add(platformKey);
      } else {
        if (!mapping.other) {
          mapping.other = url;
          usedPlatforms.add('other');
        }
      }
    });

    return mapping;
  }

  private getPlatformKey(platformName: string): SocialPlatformKey {
    const normalizedName = platformName.toLowerCase();

    if (normalizedName.includes('github')) return 'github';
    if (normalizedName.includes('twitter') || normalizedName.includes('x (')) return 'twitter';
    if (normalizedName.includes('linkedin')) return 'linkedin';
    if (normalizedName.includes('bluesky')) return 'bluesky';

    return 'other';
  }
}
