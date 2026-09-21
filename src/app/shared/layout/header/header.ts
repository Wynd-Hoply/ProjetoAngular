import { Component, ElementRef, inject, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ThemeService } from '../../../core/services/theme';
import { AuthService } from '../../../core/services/auth';
import { Endereco, ViacepService } from '../../../core/services/API/viacep.service';
import { Login } from '../../../features/auth/login/login';
import { Profile } from '../../../features/profile/profile';


@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, MatDialogModule, RouterLink, Profile],
  templateUrl: './header.html',
  styleUrl: './header.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeAllMenus()',
  },
})
export class Header {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly viacep = inject(ViacepService);

  readonly piecesMenuOpen = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly cepMenuOpen = signal(false);
  readonly cep = signal('');
  readonly endereco = signal<Endereco | null>(null);
  readonly cepError = signal('');
  readonly buscandoCep = signal(false);

  readonly pcComponents = [
    { label: 'Processadores', icon: 'CPU', route: '/components/cpu', image: '/assets/images/PROCESSADOR/Processador (1).png' },
    { label: 'Coolers', icon: 'CLK', route: '/components/cooler', image: '/assets/images/Coolers/cooler (1).png' },
    { label: 'Placas de vídeo', icon: 'GPU', route: '/components/gpu', image: '/assets/images/PLACA DE VIDEO/PlacaDeVideo (1).png' },
    { label: 'Placas-mãe', icon: 'MB', route: '/components/motherboard', image: '/assets/images/PLACA MAE/images__1_-removebg-preview.png' },
    { label: 'Memórias RAM', icon: 'RAM', route: '/components/ram', image: '/assets/images/Ram/images__1_-removebg-preview.png' },
    { label: 'Armazenamento', icon: 'SSD', route: '/components/storage', image: '/assets/images/ARM/images__7_-removebg-preview.png' },
    { label: 'Gabinetes', icon: 'CASE', route: '/components/case', image: '/assets/images/Gabinetes/images__1_-removebg-preview.png' },
    { label: 'Fontes', icon: 'PSU', route: '/components/psu', image: '/assets/images/FONTE/Fonte (1).png' },
  ];

  readonly peripherals = [
    { label: 'Monitores', icon: 'MON' },
    { label: 'Mouses', icon: 'MOU' },
    { label: 'Teclados', icon: 'KEY' },
    { label: 'Fones de ouvido', icon: 'AUDIO' },
  ];

  togglePiecesMenu(): void {
    this.piecesMenuOpen.update((isOpen) => !isOpen);
  }

  closePiecesMenu(): void {
    this.piecesMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((isOpen) => !isOpen);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  closeAllMenus(): void {
    this.closePiecesMenu();
    this.closeMobileMenu();
    this.cepMenuOpen.set(false);
  }

  toggleCepMenu(): void {
    this.cepMenuOpen.update((isOpen) => !isOpen);
  }

  consultarCep(): void {
    const cepLimpo = this.cep().replace(/\D/g, '');
    this.cep.set(cepLimpo);
    this.endereco.set(null);
    this.cepError.set('');

    if (cepLimpo.length !== 8) {
      this.cepError.set('Digite um CEP válido.');
      return;
    }

    this.buscandoCep.set(true);
    this.viacep.buscarCep(cepLimpo)
      .pipe(finalize(() => this.buscandoCep.set(false)))
      .subscribe({
        next: (endereco) => {
          if (endereco.erro) {
            this.cepError.set('CEP não encontrado.');
            return;
          }
          this.endereco.set(endereco);
        },
        error: () => this.cepError.set('Não foi possível consultar o CEP.'),
      });
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Node) || this.elementRef.nativeElement.contains(target)) {
      return;
    }
    this.closeAllMenus();
  }

  openLogin(): void {
    this.closeMobileMenu();
    this.dialog.open(Login, {
      width: 'min(420px, calc(100vw - 32px))',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'login-dialog-panel',
      autoFocus: 'input',
    });
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
    void this.router.navigate(['/']);
  }

  initials(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }
}
