import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Header } from './shared/layout/header/header';
import { AuthService } from './core/services/auth';
import { ThemeService } from './core/services/theme';
import { Footer } from "./shared/layout/footer/footer";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, Header, Footer],
  template: `
    <app-header />

    <main>
      <router-outlet />
    </main>
<app-footer />
  `,
  styleUrl: './app.css'
})
export class App {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
}