import { Component, ElementRef, inject, signal } from '@angular/core';
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
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closePiecesMenu()',
  },
})
export class Header {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  readonly piecesMenuOpen = signal(false);

  readonly pcComponents = [
    { label: 'Processadores', icon: 'CPU', route: '/components/cpu' },
    { label: 'Coolers de processador', icon: 'CLK', route: '/components/cooler' },
    { label: 'Placas de vídeo', icon: 'GPU', route: '/components/gpu' },
    { label: 'Placas-mãe', icon: 'MB', route: '/components/motherboard' },
    { label: 'Memórias', icon: 'RAM', route: '/components/ram' },
    { label: 'Armazenamentos', icon: 'SSD', route: '/components/storage' },
    { label: 'Gabinetes', icon: 'CASE', route: '/components/case' },
    { label: 'Fontes', icon: 'PSU', route: '/components/psu' },
  ];

  readonly peripherals = [
    { label: 'Monitores', icon: 'MON' },
    { label: 'Mouses', icon: 'MOU' },
    { label: 'Teclados', icon: 'KEY' },
    { label: 'Fones de ouvido', icon: 'AUDIO' },
    { label: 'Mousepads', icon: 'PAD' },
    { label: 'Cadeiras', icon: 'CHAIR' },
  ];

  togglePiecesMenu(): void {
    this.piecesMenuOpen.update((isOpen) => !isOpen);
  }

  closePiecesMenu(): void {
    this.piecesMenuOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target;

    if (!(target instanceof Node) || this.elementRef.nativeElement.contains(target)) {
      return;
    }

    this.closePiecesMenu();
  }

  openLogin(): void {
    this.dialog.open(Login, {
      width: 'min(420px, calc(100vw - 32px))',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'login-dialog-panel',
      autoFocus: 'input',
    });
  }
}
