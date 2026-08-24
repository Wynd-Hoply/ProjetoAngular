import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../../core/services/auth';
import { BuildService } from '../../core/services/build';
import { CatalogService } from '../../core/services/catalog';
import { ComponentCategory } from '../../core/models/component.model';

interface ProfileSlot {
  category: ComponentCategory;
  label: string;
}

const SLOTS: ProfileSlot[] = [
  { category: 'cpu', label: 'Processador' },
  { category: 'gpu', label: 'Placa de vídeo' },
  { category: 'motherboard', label: 'Placa-mãe' },
  { category: 'ram', label: 'Memória' },
  { category: 'storage', label: 'Armazenamento' },
  { category: 'psu', label: 'Fonte' },
  { category: 'case', label: 'Gabinete' },
  { category: 'cooler', label: 'Cooler' },
];

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly buildService = inject(BuildService);
  private readonly catalog = inject(CatalogService);

  // :username muda entre navegações dentro da MESMA rota (/perfil/A -> /perfil/B),
  // então precisa ser reativo ao paramMap (mesmo ajuste feito em lista-produtos.ts).
  readonly username = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('username') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('username') ?? '' },
  );

  // A aba vem de rotas DIFERENTES (/perfil/:u e /perfil/:u/builds), então o
  // Angular recria o componente ao trocar de aba — pode ser lida uma vez só.
  readonly tab = (this.route.snapshot.data['tab'] as 'geral' | 'builds') ?? 'geral';

  readonly profile = computed(() => this.auth.getPublicProfile(this.username()));
  readonly isOwnProfile = computed(
    () => (this.auth.currentUser()?.username ?? '').toLowerCase() === this.username().toLowerCase(),
  );

  readonly builds = computed(() => this.buildService.byOwner(this.username()));
  readonly currentBuild = computed(() => this.builds()[0] ?? null);
  readonly currentBuildItems = computed(() => {
    const build = this.currentBuild();
    if (!build) return [];
    return SLOTS
      .map((slot) => ({ slot, component: this.componentIdFor(build, slot.category) }))
      .filter((item): item is { slot: ProfileSlot; component: ReturnType<CatalogService['getById']> } => !!item.component);
  });

  readonly editing = signal(false);
  readonly editName = signal('');
  readonly editBio = signal('');
  readonly editAvatar = signal<string | null>(null);
  readonly profileMessage = signal('');
  readonly profileSuccess = signal(false);

  readonly changingPassword = signal(false);
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmNewPassword = signal('');
  readonly passwordMessage = signal('');
  readonly passwordSuccess = signal(false);
  readonly passwordLoading = signal(false);

  startEditing(): void {
    const profile = this.profile();
    if (!profile) return;
    this.editName.set(profile.name);
    this.editBio.set(profile.bio);
    this.editAvatar.set(profile.avatar);
    this.profileMessage.set('');
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
    this.changingPassword.set(false);
  }

  updateName(event: Event): void {
    this.editName.set((event.target as HTMLInputElement).value);
  }

  updateBio(event: Event): void {
    this.editBio.set((event.target as HTMLTextAreaElement).value);
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.profileMessage.set('Selecione um arquivo de imagem válido.');
      this.profileSuccess.set(false);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.profileMessage.set('A imagem deve ter no máximo 2 MB.');
      this.profileSuccess.set(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.editAvatar.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.editAvatar.set(null);
  }

  saveProfile(): void {
    const result = this.auth.updateProfile({
      name: this.editName(),
      bio: this.editBio(),
      avatar: this.editAvatar(),
    });
    this.profileMessage.set(result.message);
    this.profileSuccess.set(result.success);
    if (result.success) {
      this.editing.set(false);
    }
  }

  togglePasswordForm(): void {
    this.changingPassword.update((value) => !value);
    this.passwordMessage.set('');
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmNewPassword.set('');
  }

  async submitPasswordChange(): Promise<void> {
    if (this.newPassword() !== this.confirmNewPassword()) {
      this.passwordMessage.set('As senhas novas não coincidem.');
      this.passwordSuccess.set(false);
      return;
    }

    this.passwordLoading.set(true);
    try {
      const result = await this.auth.changePassword(this.currentPassword(), this.newPassword());
      this.passwordMessage.set(result.message);
      this.passwordSuccess.set(result.success);
      if (result.success) {
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmNewPassword.set('');
        this.changingPassword.set(false);
      }
    } finally {
      this.passwordLoading.set(false);
    }
  }

  openBuild(id: string): void {
    void this.router.navigate(['/builds', id]);
  }

  removeBuild(id: string): void {
    this.buildService.remove(id);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', { dateStyle: 'long' });
  }

  formatJoinDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  initials(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  private componentIdFor(build: { components: Partial<Record<ComponentCategory, number>> }, category: ComponentCategory) {
    const id = build.components[category];
    return id ? this.catalog.getById(id) : undefined;
  }
}