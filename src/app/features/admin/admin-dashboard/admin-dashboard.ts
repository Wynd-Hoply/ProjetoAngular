import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AdminService } from '../../../core/services/admin';
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

  protected logout(): void {
    this.adminService.logout();
    void this.router.navigate(['/admin/login']);
  }
}
