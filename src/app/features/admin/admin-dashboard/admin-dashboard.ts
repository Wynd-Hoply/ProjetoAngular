import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AdminService } from '../../../core/services/admin';
import { AuthService } from '../../../core/services/auth';
import { SavedBuild } from '../../../core/models/saved-build.model';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  protected readonly adminService = inject(AdminService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected formatDate(date: string): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(date));
  }

  protected formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected componentCount(build: SavedBuild): number {
    return Object.keys(build.components).length;
  }

  protected removeUser(username: string): void {
    if (window.confirm(`Remover o usuário ${username} e suas builds?`)) {
      this.adminService.removeUser(username);
    }
  }

  protected removeBuild(id: string, name: string): void {
    if (window.confirm(`Remover a build ${name}?`)) {
      this.adminService.removeBuild(id);
    }
  }

  // Promove/revoga acesso administrativo de outra conta.
  protected toggleAdmin(username: string, current: boolean): void {
    const action = current ? 'remover o acesso admin de' : 'tornar admin';
    if (window.confirm(`Deseja ${action} ${username}?`)) {
      this.adminService.setAdmin(username, !current);
    }
  }

  // Sair do painel agora é sair da conta, já que é o mesmo login do site.
  protected logout(): void {
    this.adminService.logout();
    void this.router.navigate(['/home']);
  }
}