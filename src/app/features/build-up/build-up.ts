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

  // Gera (ou reexibe, se já existir) o link permanente da build.
  generatePermalink(): void {
    if (this.builder.selectedComponents().length === 0) {
      this.saveMessage.set('Adicione componentes para gerar um link.');
      return;
    }

    i

    if (this.builds.activeBuildId()) {
      const build = this.builds.activeBuild();
      if (build) {
        this.savedBuild.set(build);
        this.saveMessage.set('Link pronto! Copie abaixo ou compartilhe.');
      }
      return;
    }

    this.saveBuild();
  }

  copyShareLink(): void {
    const link = this.shareLink();
    if (!link || !this.isBrowser) return;

    navigator.clipboard.writeText(link).then(
      () => this.linkCopyFeedback.set('Link copiado!'),
      () => this.linkCopyFeedback.set(link),
    );
  }

  // Usa a Web Share API nativa (mobile) quando disponível; senão, cai para copiar o link.
  async shareBuild(): Promise<void> {
    if (!this.shareLink()) {
      this.generatePermalink();
    }

    const link = this.shareLink();
    if (!link) return;

    const canNativeShare = this.isBrowser && typeof navigator !== 'undefined' && !!navigator.share;
    if (canNativeShare) {
      try {
        await navigator.share({ title: this.buildName(), text: 'Confira minha build no PC Builder', url: link });
        return;
      } catch {
        // usuário cancelou o compartilhamento nativo — cai para copiar o link
      }
    }

    this.copyShareLink();
  }

  sendByEmail(): void {
    if (!this.isBrowser) return;
    if (!this.shareLink()) {
      this.generatePermalink();
    }

    const link = this.shareLink();
    const subject = encodeURIComponent(`Build: ${this.buildName()}`);
    const body = encodeURIComponent(
      link
        ? `Dá uma olhada na build que eu montei:\n${link}`
        : `Build: ${this.buildName()}\nTotal: ${this.formatPrice(this.builder.total())}`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  reportBug(): void {
    if (!this.isBrowser) return;
    const subject = encodeURIComponent('Reportar bug — PC Builder');
    const body = encodeURIComponent(`Descreva o problema encontrado:\n\n\n---\nPágina: Montar PC\nBuild atual: ${this.buildName()}`);
    window.location.href = `mailto:suporte@pcbuilder.com?subject=${subject}&body=${body}`;
  }

  startNewBuild(): void {
    this.builder.clear();
    this.builds.clearActive();
    this.buildName.set(DEFAULT_BUILD_NAME);
    this.savedBuild.set(null);
    this.saveMessage.set('');
    this.linkCopyFeedback.set('');
  }

  togglePublic(): void {
    const build = this.savedBuild();
    if (!build) return;
    this.builds.setPublic(build.id, !build.isPublic);
    this.savedBuild.set({ ...build, isPublic: !build.isPublic });
  }
}