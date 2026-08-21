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
    
    @if (authService.isAuthenticated()) {
      <div class="container-principal">
        <section class="bloco-controle">
          <div class="bloco-controle__card bloco-controle__card--active">
            <div>
              <p class="bloco-controle__eyebrow">Sessão ativa</p>
              <h2>Olá, {{ authService.displayName() }}</h2>
              <p>Seu acesso está salvo neste navegador via localStorage.</p>
            </div>
            <div class="bloco-controle__actions">
              <a class="bloco-controle__action" routerLink="/build-up">Continuar montando</a>
              <button type="button" class="bloco-controle__action bloco-controle__action--ghost" (click)="authService.logout()">Sair</button>
            </div>
          </div>
        </section>
      </div>
    }

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
        <p>&copy; 2026 PC Builder. Todos os direitos reservados.</p>
      </div>
    </footer>
  `,
  styleUrl: './app.css'
})
export class App {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
}