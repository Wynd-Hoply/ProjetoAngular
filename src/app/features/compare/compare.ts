import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ComparisonService } from '../../core/services/comparison';
import { ComponentSpecifications } from '../../core/models/component.model';

interface ComparisonRow {
  label: string;
  values: string[];
  differs: boolean;
}

@Component({
  selector: 'app-compare',
  imports: [RouterLink],
  templateUrl: './compare.html',
  styleUrl: './compare.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Compare {
  readonly comparison = inject(ComparisonService);
  readonly rows = computed(() => this.createRows(this.comparison.selected()));

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatSpecifications(specifications: ComponentSpecifications): string[] {
    return [
      this.value('Socket', specifications.socket),
      this.value('Núcleos', specifications.coreCount),
      this.value('Threads', specifications.threadCount),
      this.value('Clock boost', specifications.boostClockGHz, ' GHz'),
      this.value('VRAM', specifications.vramGB, ' GB'),
      this.value('Memória', specifications.memoryType),
      this.value('Velocidade', specifications.memorySpeedMHz, ' MHz'),
      this.value('Interface', specifications.interface),
      this.value('Chipset', specifications.chipset),
      this.value('Formato', specifications.formFactor),
      this.value('Tipo de RAM', specifications.ramType),
      this.value('Capacidade', this.capacity(specifications.capacityGB)),
      this.value('Leitura', specifications.readSpeedMBps, ' MB/s'),
      this.value('Gravação', specifications.writeSpeedMBps, ' MB/s'),
      this.value('Potência da fonte', specifications.wattage, ' W'),
      this.value('Eficiência', specifications.efficiency),
      this.value('Modular', specifications.modular === undefined ? undefined : specifications.modular ? 'Sim' : 'Não'),
      this.value('Compatibilidade', specifications.supportedSockets?.join(', ')),
      this.value('Comprimento GPU', specifications.gpuLengthMm, ' mm'),
      this.value('Altura cooler', specifications.coolerHeightMm, ' mm'),
      this.value('Radiador', specifications.radiatorSizeMm, ' mm'),
    ].filter((value): value is string => value !== undefined);
  }

  private createRows(components: ReturnType<ComparisonService['selected']>): ComparisonRow[] {
    const rows: ComparisonRow[] = [
      { label: 'Fabricante', values: components.map((component) => component.brand), differs: false },
      { label: 'Preço', values: components.map((component) => this.formatPrice(component.price)), differs: false },
      { label: 'Desempenho', values: components.map((component) => `${component.performanceScore} pts`), differs: false },
      { label: 'Consumo', values: components.map((component) => `${component.powerDrawWatts} W`), differs: false },
    ];

    const specificationValues = components.map((component) => this.formatSpecifications(component.specifications));
    const labels = [...new Set(specificationValues.flatMap((values) => values.map((value) => value.split(': ')[0])))];

    for (const label of labels) {
      const values = specificationValues.map((specifications) => specifications.find((value) => value.startsWith(`${label}: `))?.slice(label.length + 2) ?? 'Não informado');
      rows.push({ label, values, differs: new Set(values).size > 1 });
    }

    return rows.map((row) => ({ ...row, differs: new Set(row.values).size > 1 }));
  }

  private value(label: string, value: string | number | undefined, suffix = ''): string | undefined {
    return value === undefined ? undefined : `${label}: ${value}${suffix}`;
  }

  private capacity(value: number | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value >= 1000 ? `${value / 1000} TB` : `${value} GB`;
  }
}
