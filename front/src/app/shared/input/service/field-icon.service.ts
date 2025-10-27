import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class FieldIconService {
  private readonly sanitizer = inject(DomSanitizer);

  sanitizeSvgPath(iconPath: string, viewBox: string = '0 0 16 16'): SafeHtml {
    if (!iconPath || iconPath.trim() === '') {
      return '';
    }

    try {
      if (iconPath.trim().startsWith('<svg')) {
        return this.sanitizer.bypassSecurityTrustHtml(iconPath);
      }

      const svgWrapper = `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="16"
             height="16"
             viewBox="${viewBox}"
             fill="currentColor">
          ${iconPath}
        </svg>
      `;

      return this.sanitizer.bypassSecurityTrustHtml(svgWrapper);
    } catch (error) {
      console.error('Error processing SVG:', error, iconPath);
      return '';
    }
  }
}
