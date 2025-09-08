import { Injectable } from '@angular/core';

type ThemeKey = 
'arya-blue'|
'arya-green'|
'arya-orange'|
'arya-purple'|
'aura-dark-amber'|
'aura-dark-blue'|
'aura-dark-cyan'|
'aura-dark-green'|
'aura-dark-indigo'|
'aura-dark-lime'|
'aura-dark-noir'|
'aura-dark-pink'|
'aura-dark-purple'|
'aura-dark-teal'|
'aura-light-amber'|
'aura-light-blue'|
'aura-light-cyan'|
'aura-light-green'|
'aura-light-indigo'|
'aura-light-lime'|
'aura-light-noir'|
'aura-light-pink'|
'aura-light-purple'|
'aura-light-teal'|
'bootstrap4-dark-blue'|
'bootstrap4-dark-purple'|
'bootstrap4-light-blue'|
'bootstrap4-light-purple'|
'fluent-light'|
'lara-dark-amber'|
'lara-dark-blue'|
'lara-dark-cyan'|
'lara-dark-green'|
'lara-dark-indigo'|
'lara-dark-pink'|
'lara-dark-purple'|
'lara-dark-teal'|
'lara-light-amber'|
'lara-light-blue'|
'lara-light-cyan'|
'lara-light-green'|
'lara-light-indigo'|
'lara-light-pink'|
'lara-light-purple'|
'lara-light-teal'|
'luna-amber'|
'luna-blue'|
'luna-green'|
'luna-pink'|
'md-dark-deeppurple'|
'md-dark-indigo'|
'md-light-deeppurple'|
'md-light-indigo'|
'mdc-dark-deeppurple'|
'mdc-dark-indigo'|
'mdc-light-deeppurple'|
'mdc-light-indigo'|
'mira'|
'nano'|
'nova'|
'nova-accent'|
'nova-alt'|
'rhea'|
'saga-blue'|
'saga-green'|
'saga-orange'|
'saga-purple'|
'soho-dark'|
'soho-light'|
'tailwind-light'|
'vela-blue'|
'vela-green'|
'vela-orange'|
'vela-purple'|
'viva-dark'|
'viva-light'
;

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'myfish.theme';
  private readonly linkId = 'theme-css';

  initTheme() {
    const saved = (localStorage.getItem(this.storageKey) as ThemeKey) || 'mira';
    this.applyTheme(saved);
  }

  getCurrent(): ThemeKey {
    return (localStorage.getItem(this.storageKey) as ThemeKey) || 'mira';
  }


  applyTheme(theme: ThemeKey) {
    const linkEl = document.getElementById('theme-css') as HTMLLinkElement;
    linkEl.href = `assets/primeng/resources/themes/${theme}/theme.css`;
    localStorage.setItem('myfish.theme', theme);
  }
}
