import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, map, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly iconCache = new Map<string, Observable<SafeHtml>>();

  getIcon(iconName: string): Observable<SafeHtml> {
    if (!this.iconCache.has(iconName)) {
      const iconObservable = this.http.get(`/assets/icons/${iconName}.svg`, { responseType: 'text' })
        .pipe(
          map(svgContent => this.sanitizer.bypassSecurityTrustHtml(svgContent)),
          shareReplay(1)
        );

      this.iconCache.set(iconName, iconObservable);
    }

    return this.iconCache.get(iconName)!;
  }
}
