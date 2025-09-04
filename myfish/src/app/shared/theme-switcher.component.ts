import { Component, effect, signal } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../core/theme.service';

type ThemeKey = 'lara-light-blue' | 'lara-dark-blue';

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
  options = [
    { label: 'Lara Light Blue', value: 'lara-light-blue' as ThemeKey },
    { label: 'Lara Dark Blue',  value: 'lara-dark-blue'  as ThemeKey }
  ];

  selected = signal<ThemeKey>('lara-light-blue');

  constructor(private theme: ThemeService) {
    // setează din storage
    this.selected.set(this.theme.getCurrent());
    // aplică la schimbare
    effect(() => this.theme.applyTheme(this.selected()));
  }
}
