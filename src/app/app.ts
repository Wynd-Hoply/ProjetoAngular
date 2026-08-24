import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Header } from './shared/layout/header/header';
import { AuthService } from './core/services/auth';
import { ThemeService } from './core/services/theme';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, Header],
  template: `
    <app-header />

    <main>
      <router-outlet />
    </main>

    <!-- FOOTER INTEGRADO -->
    <footer class="custom-footer">
      <div class="footer-container">
        <div class="footer-brand">
          <img src="assets/images/LogoWM.png" alt="Logo PCraft" class="footer-logo" />
          <p class="footer-description">
            Escolha componentes, confira a compatibilidade e monte uma configuração que faz sentido para o seu orçamento e seu jeito de usar.
          </p>
        </div>

        <div class="footer-links">
          <h3>Plataforma</h3>
          <nav class="footer-nav">
            <a routerLink="/home">Início</a>
            <a routerLink="/build-up">Montar PC</a>
            <a routerLink="/builds">Minhas Builds</a>
            <a routerLink="/compare">Comparar</a>
          </nav>
        </div>

        <div class="footer-social">
          <h3>Acompanhe</h3>
          <div class="social-icons">
            <a href="#" aria-label="Instagram" class="social-btn">IG</a>
            <a href="#" aria-label="Twitter" class="social-btn">X</a>
            <a href="#" aria-label="YouTube" class="social-btn">YT</a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; 2026 PCraft. Todos os direitos reservados.</p>
      </div>
    </footer>
  `,
  styleUrl: './app.css'
})
export class App {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
}