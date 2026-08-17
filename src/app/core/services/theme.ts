import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Chave usada para persistir a preferencia de tema no navegador.
  private readonly THEME_KEY = 'user-theme';
  // Controle para evitar acesso a APIs de navegador durante SSR.
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  // Estado reativo consumido pelos componentes para refletir o tema atual.
  isDarkMode = signal(false);

  constructor() {
    // Inicializa tema ao criar o servico para manter consistencia visual.
    this.initTheme();
  }

  private initTheme(): void {
    // Sai cedo quando estiver no servidor (sem window/localStorage).
    if (!this.isBrowser) {
      return;
    }

    // Prioriza tema salvo; sem valor salvo, segue preferencia do sistema.
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    this.setDarkMode(isDark);
  }

  toggleTheme(): void {
    // Alterna entre claro e escuro a partir do estado atual.
    this.setDarkMode(!this.isDarkMode());
  }

  private setDarkMode(isDark: boolean): void {
    // Atualiza o estado reativo para refletir a mudanca no app.
    this.isDarkMode.set(isDark);

    if (!this.isBrowser) {
      return;
    }

    // Persiste o tema e atualiza classe global para habilitar estilos do modo escuro.
    localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');

    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}
