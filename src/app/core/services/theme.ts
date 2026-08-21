import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'user-theme';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  
  isDarkMode = signal<boolean>(this.getInitialThemeState());

  constructor() {
    this.applyTheme(this.isDarkMode());
  }

  private getInitialThemeState(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      return savedTheme === 'dark';
    }

    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggleTheme(): void {
    this.setDarkMode(!this.isDarkMode());
  }

  private setDarkMode(isDark: boolean): void {
    this.isDarkMode.set(isDark);

    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
    this.applyTheme(isDark);
  }

  private applyTheme(isDark: boolean): void {
    if (!this.isBrowser) {
      return;
    }

    if (isDark) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    }
  }
}