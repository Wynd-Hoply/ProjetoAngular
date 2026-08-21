import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'user-theme';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  
  // Agora o padrão inicial é true (Modo Escuro)
  isDarkMode = signal(true); 

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (!this.isBrowser) {
      return;
    }

    const savedTheme = localStorage.getItem(this.THEME_KEY);
    // Se não tiver nada salvo, assume escuro. Se tiver, lê a preferência.
    const isDark = savedTheme ? savedTheme === 'dark' : true; 
    this.setDarkMode(isDark);
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

    // LÓGICA INVERTIDA: Adiciona 'light-mode' se NÃO for dark
    if (isDark) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }
}