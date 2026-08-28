import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme';

import { ElementRef, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { Login } from '../../../features/auth/login/login';
import { Profile } from '../../../features/profile/profile';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})

export class Footer {
themeService = inject(ThemeService);

private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly piecesMenuOpen = signal(false);
  readonly mobileMenuOpen = signal(false);
}