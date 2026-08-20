import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BuildService } from '../../core/services/build';
import { BuilderService } from '../../core/services/builder';
import { CompatibilityService } from '../../core/services/compatibility';
import { Component as CatalogComponent, ComponentCategory } from '../../core/models/component.model';

interface SummarySlot {
  category: ComponentCategory;
  label: string;
}

@Component({
  selector: 'app-build-summary',
  imports: [RouterLink],
  templateUrl: './build-summary.html',
  styleUrl: './build-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildSummary {
  readonly buildService = inject(BuildService);
  readonly builder = inject(BuilderService);
  readonly compatibility = inject(CompatibilityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly slots: SummarySlot[] = [
    { category: 'cpu', label: 'Processador' },
    { category: 'gpu', label: 'Placa de vídeo' },
    { category: 'motherboard', label: 'Placa-mãe' },
    { category: 'ram', label: 'Memória RAM' },
    { category: 'storage', label: 'Armazenamento' },
    { category: 'psu', label: 'Fonte' },
    { category: 'case', label: 'Gabinete' },
    { category: 'cooler', label: 'Cooler' },
  ];
  readonly build = computed(() => this.buildService.getById(this.route.snapshot.paramMap.get('id') ?? ''));
  readonly missingSlots = computed(() => this.slots.filter((slot) => !this.builder.selected()[slot.category]));
  readonly components = computed(() => this.slots
    .map((slot) => ({ slot, component: this.builder.selected()[slot.category] }))
    .filter((item): item is { slot: SummarySlot; component: CatalogComponent } => item.component !== undefined));

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.buildService.open(id)) {
      return;
    }

    void this.router.navigate(['/builds']);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', { dateStyle: 'long' });
  }

  specificationSummary(component: CatalogComponent): string {
    const specs = component.specifications;
    return [
      specs.socket,
      specs.ramType,
      specs.coreCount ? `${specs.coreCount} núcleos` : undefined,
      specs.vramGB ? `${specs.vramGB} GB VRAM` : undefined,
      specs.capacityGB ? `${specs.capacityGB >= 1000 ? specs.capacityGB / 1000 + ' TB' : specs.capacityGB + ' GB'}` : undefined,
      specs.formFactor,
      specs.wattage ? `${specs.wattage} W` : undefined,
    ].filter(Boolean).slice(0, 3).join(' · ');
  }

  saveBuild(): void {
    const build = this.build();
    if (build) {
      this.buildService.save(build.name, build.id);
    }
  }
}