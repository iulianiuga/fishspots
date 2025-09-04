import { Injectable } from '@angular/core';

type ThemeKey = 'lara-light-blue' | 'lara-dark-blue' | 'fluent-light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'myfish.theme';
  private readonly linkId = 'theme-css';

  initTheme() {
    const saved = (localStorage.getItem(this.storageKey) as ThemeKey) || 'lara-light-blue';
    this.applyTheme(saved);
  }

  getCurrent(): ThemeKey {
    return (localStorage.getItem(this.storageKey) as ThemeKey) || 'lara-light-blue';
  }

  // applyTheme(theme: ThemeKey) {
  //   const linkEl = document.getElementById(this.linkId) as HTMLLinkElement | null;
  //   const href = `assets/primeng/resources/themes/${theme}/theme.css`;
  //   if (linkEl) {
  //     linkEl.href = href;
  //     localStorage.setItem(this.storageKey, theme);
  //   } else {
  //     // fallback (nu ar trebui sa se intample)
  //     const el = document.createElement('link');
  //     el.id = this.linkId;
  //     el.rel = 'stylesheet';
  //     el.href = href;
  //     document.head.appendChild(el);
  //     localStorage.setItem(this.storageKey, theme);
  //   }
  // }
  applyTheme(theme: ThemeKey) {
    const linkEl = document.getElementById('theme-css') as HTMLLinkElement;
    linkEl.href = `assets/primeng/resources/themes/${theme}/theme.css`;
    localStorage.setItem('myfish.theme', theme);
  }
}
