import { Injectable } from '@angular/core';

type ThemeKey = 'lara-light-blue' | 'lara-dark-blue' | 'fluent-light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'myfish.theme';
  private readonly linkId = 'theme-css';

  initTheme() {
    const saved = (localStorage.getItem(this.storageKey) as ThemeKey) || 'fluent-light';
    this.applyTheme(saved);
  }

  getCurrent(): ThemeKey {
    return (localStorage.getItem(this.storageKey) as ThemeKey) || 'fluent-light';
  }


  applyTheme(theme: ThemeKey) {
    const linkEl = document.getElementById('theme-css') as HTMLLinkElement;
    linkEl.href = `assets/primeng/resources/themes/${theme}/theme.css`;
    localStorage.setItem('myfish.theme', theme);
  }
}
