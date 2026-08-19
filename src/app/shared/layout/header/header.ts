import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme';
import { AuthService } from '../../../core/services/auth';
import { Login } from '../../../features/auth/login/login';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, MatDialogModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  openLogin(): void {
    this.dialog.open(Login, {
      width: 'min(420px, calc(100vw - 32px))',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'login-dialog-panel',
      autoFocus: 'input',
    });
  }
}
