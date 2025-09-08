import { Component, effect, signal } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../core/theme.service';

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


@Component({
  selector: 'theme-switcher',
  standalone: true,
  imports: [DropdownModule, FormsModule],
  template: `
    <p-dropdown
      [options]="options"
      [(ngModel)]="selected"
      optionLabel="label"
      optionValue="value"
      styleClass="w-14rem"
      [showClear]="false"
      placeholder="Alege tema">
    </p-dropdown>
  `
})
export class ThemeSwitcherComponent {
  options =  [
  { label: 'Arya Blue', value: 'arya-blue' },
  { label: 'Arya Green', value: 'arya-green' },
  { label: 'Arya Orange', value: 'arya-orange' },
  { label: 'Arya Purple', value: 'arya-purple' },

  { label: 'Aura Dark Amber', value: 'aura-dark-amber' },
  { label: 'Aura Dark Blue', value: 'aura-dark-blue' },
  { label: 'Aura Dark Cyan', value: 'aura-dark-cyan' },
  { label: 'Aura Dark Green', value: 'aura-dark-green' },
  { label: 'Aura Dark Indigo', value: 'aura-dark-indigo' },
  { label: 'Aura Dark Lime', value: 'aura-dark-lime' },
  { label: 'Aura Dark Noir', value: 'aura-dark-noir' },
  { label: 'Aura Dark Pink', value: 'aura-dark-pink' },
  { label: 'Aura Dark Purple', value: 'aura-dark-purple' },
  { label: 'Aura Dark Teal', value: 'aura-dark-teal' },

  { label: 'Aura Light Amber', value: 'aura-light-amber' },
  { label: 'Aura Light Blue', value: 'aura-light-blue' },
  { label: 'Aura Light Cyan', value: 'aura-light-cyan' },
  { label: 'Aura Light Green', value: 'aura-light-green' },
  { label: 'Aura Light Indigo', value: 'aura-light-indigo' },
  { label: 'Aura Light Lime', value: 'aura-light-lime' },
  { label: 'Aura Light Noir', value: 'aura-light-noir' },
  { label: 'Aura Light Pink', value: 'aura-light-pink' },
  { label: 'Aura Light Purple', value: 'aura-light-purple' },
  { label: 'Aura Light Teal', value: 'aura-light-teal' },

  { label: 'Bootstrap 4 Dark Blue', value: 'bootstrap4-dark-blue' },
  { label: 'Bootstrap 4 Dark Purple', value: 'bootstrap4-dark-purple' },
  { label: 'Bootstrap 4 Light Blue', value: 'bootstrap4-light-blue' },
  { label: 'Bootstrap 4 Light Purple', value: 'bootstrap4-light-purple' },

  { label: 'Fluent Light', value: 'fluent-light' },

  { label: 'Lara Dark Amber', value: 'lara-dark-amber' },
  { label: 'Lara Dark Blue', value: 'lara-dark-blue' },
  { label: 'Lara Dark Cyan', value: 'lara-dark-cyan' },
  { label: 'Lara Dark Green', value: 'lara-dark-green' },
  { label: 'Lara Dark Indigo', value: 'lara-dark-indigo' },
  { label: 'Lara Dark Pink', value: 'lara-dark-pink' },
  { label: 'Lara Dark Purple', value: 'lara-dark-purple' },
  { label: 'Lara Dark Teal', value: 'lara-dark-teal' },

  { label: 'Lara Light Amber', value: 'lara-light-amber' },
  { label: 'Lara Light Blue', value: 'lara-light-blue' },
  { label: 'Lara Light Cyan', value: 'lara-light-cyan' },
  { label: 'Lara Light Green', value: 'lara-light-green' },
  { label: 'Lara Light Indigo', value: 'lara-light-indigo' },
  { label: 'Lara Light Pink', value: 'lara-light-pink' },
  { label: 'Lara Light Purple', value: 'lara-light-purple' },
  { label: 'Lara Light Teal', value: 'lara-light-teal' },

  { label: 'Luna Amber', value: 'luna-amber' },
  { label: 'Luna Blue', value: 'luna-blue' },
  { label: 'Luna Green', value: 'luna-green' },
  { label: 'Luna Pink', value: 'luna-pink' },

  { label: 'MD Dark Deep Purple', value: 'md-dark-deeppurple' },
  { label: 'MD Dark Indigo', value: 'md-dark-indigo' },
  { label: 'MD Light Deep Purple', value: 'md-light-deeppurple' },
  { label: 'MD Light Indigo', value: 'md-light-indigo' },

  { label: 'MDC Dark Deep Purple', value: 'mdc-dark-deeppurple' },
  { label: 'MDC Dark Indigo', value: 'mdc-dark-indigo' },
  { label: 'MDC Light Deep Purple', value: 'mdc-light-deeppurple' },
  { label: 'MDC Light Indigo', value: 'mdc-light-indigo' },

  { label: 'Mira', value: 'mira' },
  { label: 'Nano', value: 'nano' },
  { label: 'Nova', value: 'nova' },
  { label: 'Nova Accent', value: 'nova-accent' },
  { label: 'Nova Alt', value: 'nova-alt' },
  { label: 'Rhea', value: 'rhea' },

  { label: 'Saga Blue', value: 'saga-blue' },
  { label: 'Saga Green', value: 'saga-green' },
  { label: 'Saga Orange', value: 'saga-orange' },
  { label: 'Saga Purple', value: 'saga-purple' },

  { label: 'Soho Dark', value: 'soho-dark' },
  { label: 'Soho Light', value: 'soho-light' },

  { label: 'Tailwind Light', value: 'tailwind-light' },

  { label: 'Vela Blue', value: 'vela-blue' },
  { label: 'Vela Green', value: 'vela-green' },
  { label: 'Vela Orange', value: 'vela-orange' },
  { label: 'Vela Purple', value: 'vela-purple' },

  { label: 'Viva Dark', value: 'viva-dark' },
  { label: 'Viva Light', value: 'viva-light' }
];

  selected = signal<ThemeKey>('lara-light-blue');

  constructor(private theme: ThemeService) {
    // setează din storage
    this.selected.set(this.theme.getCurrent());
    // aplică la schimbare
    effect(() => this.theme.applyTheme(this.selected()));
  }
}
