import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Header } from './shared/layout/header/header';
import { ThemeService } from './services/theme'
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  themeService = inject(ThemeService);
}


