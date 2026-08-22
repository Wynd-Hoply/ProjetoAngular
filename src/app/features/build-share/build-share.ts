import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../../core/services/auth';
import { BuilderService } from '../../core/services/builder';
import { BuildService } from '../../core/services/build';
import { CatalogService } from '../../core/services/catalog';
import { Component as CatalogComponent, ComponentCategory } from '../../core/models/component.model';

interface ShareSlot {
  category: ComponentCategory;
  label: string;
}

const SLOTS: ShareSlot[] = [
  { category: 'cpu', label: 'Processador' },
  { category: 'gpu', label: 'Placa de vídeo' },
  { category: 'motherboard', label: 'Placa-mãe' },
  { category: 'ram', label: 'Memória RAM' },
  { category: 'storage', label: 'Armazenamento' },
  { category: 'psu', label: 'Fonte' },
  { category: 'case', label: 'Gabinete' },
  { category: 'cooler', label: 'Cooler' },
];

@Component({
  selector: 'app-build-share',
  imports: [CommonModule, RouterLink],
  templateUrl: './build-share.html',
  styleUrl: './build-share.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildShare {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly buildService = inject(BuildService);
  private readonly builder = inject(BuilderService);
  private readonly catalog = inject(CatalogService);

  // :shareId muda entre navegações na mesma rota (link A -> link B), então
  // precisa ser reativo (mesmo padrão de lista-produtos.ts e profile.ts).
  readonly shareId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('shareId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('shareId') ?? '' },
  );

  readonly build = computed(() => this.buildService.getByShareId(this.shareId()));
  readonly author = computed(() => {
    const build = this.build();
    return build ? this.auth.getPublicProfile(build.owner) : null;
  });
  readonly isOwner = computed(() => this.auth.currentUser()?.username === this.build()?.owner);

  readonly items = computed(() => {
    const build = this.build();
    if (!build) return [];
    return SLOTS
      .map((slot) => ({ slot, component: this.componentFor(build, slot.category) }))
      .filter((item): item is { slot: ShareSlot; component: CatalogComponent } => !!item.component);
  });

  readonly missingSlots = computed(() => {
    const build = this.build();
    if (!build) return [];
    return SLOTS.filter((slot) => !build.components[slot.category]);
  });

  readonly copyFeedback = signal('');

  copyLink(): void {
    const build = this.build();
    if (!build) return;
    const link = this.buildService.buildLink(build.shareId);

    navigator.clipboard.writeText(link).then(
      () => this.copyFeedback.set('Link copiado!'),
      () => this.copyFeedback.set(link),
    );
  }

  togglePublic(): void {
    const build = this.build();
    if (!build) return;
    this.buildService.setPublic(build.id, !build.isPublic);
  }

  // Carrega essa build no builder do visitante (sem apagar a build original).
  useThisBuild(): void {
    const build = this.build();
    if (!build) return;
    this.builder.load(build.components);
    void this.router.navigate(['/builder']);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', { dateStyle: 'long' });
  }

  private componentFor(build: { components: Partial<Record<ComponentCategory, number>> }, category: ComponentCategory) {
    const id = build.components[category];
    return id ? this.catalog.getById(id) : undefined;
  }
}