import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BuilderService } from '../../core/services/builder';
import { BuildService } from '../../core/services/build';
import { CompatibilityService } from '../../core/services/compatibility';
import { ComponentCategory } from '../../core/models/component.model';
import { SavedBuild } from '../../core/models/saved-build.model';

interface BuilderSlot {
  category: ComponentCategory;
  label: string;
  route: string;
}

const DEFAULT_BUILD_NAME = 'Minha configuração';

@Component({
  selector: 'app-build-up',
  imports: [RouterLink],
  templateUrl: './build-up.html',
  styleUrl: './build-up.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildUp {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly builder = inject(BuilderService);
  readonly builds = inject(BuildService);
  readonly compatibility = inject(CompatibilityService);
  readonly buildName = signal(DEFAULT_BUILD_NAME);
  readonly saveMessage = signal('');
  readonly savedBuild = signal<SavedBuild | null>(null);
  readonly linkCopyFeedback = signal('');

  readonly slots: BuilderSlot[] = [
    { category: 'cpu', label: 'Processador', route: 'cpu' },
    { category: 'gpu', label: 'Placa de vídeo', route: 'gpu' },
    { category: 'motherboard', label: 'Placa-mãe', route: 'motherboard' },
    { category: 'ram', label: 'Memória RAM', route: 'ram' },
    { category: 'storage', label: 'Armazenamento', route: 'storage' },
    { category: 'psu', label: 'Fonte', route: 'psu' },
    { category: 'case', label: 'Gabinete', route: 'case' },
    { category: 'cooler', label: 'Cooler', route: 'cooler' },
  ];
  readonly missingSlots = computed(() => this.slots.filter((slot) => !this.builder.selected()[slot.category]));
  readonly shareLink = computed(() => {
    const build = this.savedBuild();
    return build ? this.builds.buildLink(build.shareId) : '';
  });

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  statusLabel(status: 'compatible' | 'incompatible' | 'pending'): string {
    return status === 'compatible' ? 'Compatível' : status === 'incompatible' ? 'Incompatibilidade' : 'Aguardando seleção';
  }

  remove(category: ComponentCategory): void {
    this.builder.remove(category);
  }

  saveBuild(): void {
    const savedBuild = this.builds.save(this.buildName(), this.builds.activeBuildId());
    this.savedBuild.set(savedBuild);
    this.linkCopyFeedback.set('');
    this.saveMessage.set(savedBuild ? `Build "${savedBuild.name}" salva com sucesso.` : 'Adicione componentes e informe um nome para salvar.');
  }
}