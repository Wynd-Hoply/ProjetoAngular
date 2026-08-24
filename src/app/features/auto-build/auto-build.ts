import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import {
  AutoBuildCpuPreference,
  AutoBuildGpuPreference,
  AutoBuildPreferences,
  AutoBuildPriority,
  AutoBuildPurpose,
  AutoBuildResult,
} from '../../core/models/auto-build.model';
import { Component as CatalogComponent, ComponentCategory } from '../../core/models/component.model';
import { AutoBuildService } from '../../core/services/auto-build';

interface BudgetOption {
  label: string;
  value: number;
}

interface PreferenceOption<T extends string> {
  label: string;
  value: T;
}

const purposeLabels: Record<AutoBuildPurpose, string> = {
  gaming: 'Gaming',
  work: 'Trabalho',
  study: 'Estudos',
  editing: 'Edição/Criação',
  general: 'Uso geral',
};

const categoryLabels: Record<ComponentCategory, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  motherboard: 'Placa-mãe',
  ram: 'RAM',
  storage: 'Armazenamento',
  psu: 'Fonte',
  case: 'Gabinete',
  cooler: 'Cooler',
};

@Component({
  selector: 'app-auto-build',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './auto-build.html',
  styleUrl: './auto-build.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoBuild {
  readonly isGenerating = computed(() => this.autoBuildService.status() === 'generating');

generateBuild(): void {
  if (this.isGenerating()) return; // trava contra clique duplo, mesmo sendo rápido agora

  const budget = this.resolveBudget();
  if (budget <= 0) {
    this.feedback.set('Informe um orçamento válido para gerar a build.');
    this.result.set(null);
    return;
  }

  const preferences: AutoBuildPreferences = {
    budget,
    purpose: this.purpose(),
    cpuPreference: this.cpuPreference(),
    gpuPreference: this.gpuPreference(),
    priority: this.priority(),
  };

  const result = this.autoBuildService.generateBuild(preferences, this.attempt());
  this.result.set(result);
  this.feedback.set(result.message);

  if (result.feasible) {
    this.attempt.update((value) => value + 1);
  }
}


  private readonly router = inject(Router);
  private readonly autoBuildService = inject(AutoBuildService);

  readonly presetBudgets: BudgetOption[] = [
    { label: 'R$ 2.500', value: 2500 },
    { label: 'R$ 3.000', value: 3000 },
    { label: 'R$ 4.000', value: 4000 },
    { label: 'R$ 5.000', value: 5000 },
    { label: 'R$ 7.000', value: 7000 },
    { label: 'R$ 10.000', value: 10000 },
  ];

  readonly purposeOptions: PreferenceOption<AutoBuildPurpose>[] = [
    { label: 'Gaming', value: 'gaming' },
    { label: 'Trabalho', value: 'work' },
    { label: 'Estudos', value: 'study' },
    { label: 'Edição/Criação', value: 'editing' },
    { label: 'Uso geral', value: 'general' },
  ];

  readonly cpuOptions: PreferenceOption<AutoBuildCpuPreference>[] = [
    { label: 'Tanto faz', value: 'any' },
    { label: 'AMD', value: 'amd' },
    { label: 'Intel', value: 'intel' },
  ];

  readonly gpuOptions: PreferenceOption<AutoBuildGpuPreference>[] = [
    { label: 'Tanto faz', value: 'any' },
    { label: 'NVIDIA', value: 'nvidia' },
    { label: 'AMD', value: 'amd' },
  ];

  readonly priorityOptions: PreferenceOption<AutoBuildPriority>[] = [
    { label: 'Melhor desempenho', value: 'performance' },
    { label: 'Melhor custo-benefício', value: 'value' },
    { label: 'Economia', value: 'economy' },
  ];

  readonly budget = signal(7000);
  readonly customBudget = signal('');
  readonly purpose = signal<AutoBuildPurpose>('gaming');
  readonly cpuPreference = signal<AutoBuildCpuPreference>('any');
  readonly gpuPreference = signal<AutoBuildGpuPreference>('any');
  readonly priority = signal<AutoBuildPriority>('value');
  readonly attempt = signal(0);
  readonly result = signal<AutoBuildResult | null>(null);
  readonly feedback = signal('');

  readonly canGenerate = computed(() => this.resolveBudget() > 0);
  readonly currentBudgetLabel = computed(() => this.formatCurrency(this.resolveBudget()));
  readonly resultEntries = computed(() => {
    const currentResult = this.result();
    return currentResult ? (Object.entries(currentResult.components) as Array<[ComponentCategory, CatalogComponent]>) : [];
  });

  useBuild(): void {
    const result = this.result();
    if (!result?.feasible) {
      return;
    }

    this.autoBuildService.useBuild(result);
    void this.router.navigate(['/builder']);
  }

  editBuild(): void {
    this.useBuild();
  }

  redoBuild(): void {
    this.generateBuild();
  }

  selectPresetBudget(value: number): void {
    this.budget.set(value);
    this.customBudget.set('');
    this.attempt.set(0);
  }

  updateCustomBudget(value: string): void {
    this.customBudget.set(value);
    const parsed = Number(value.replace(/[R$\s\.]/g, '').replace(',', '.'));
    if (Number.isFinite(parsed) && parsed > 0) {
      this.budget.set(parsed);
      this.attempt.set(0);
    }
  }

  setPurpose(value: AutoBuildPurpose): void {
    this.purpose.set(value);
    this.attempt.set(0);
  }

  setCpuPreference(value: AutoBuildCpuPreference): void {
    this.cpuPreference.set(value);
    this.attempt.set(0);
  }

  setGpuPreference(value: AutoBuildGpuPreference): void {
    this.gpuPreference.set(value);
    this.attempt.set(0);
  }

  setPriority(value: AutoBuildPriority): void {
    this.priority.set(value);
    this.attempt.set(0);
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatPrice(value: number): string {
    return this.formatCurrency(value);
  }

  categoryLabel(category: ComponentCategory): string {
    return categoryLabels[category];
  }

  purposeLabel(purpose: AutoBuildPurpose): string {
    return purposeLabels[purpose];
  }

  private resolveBudget(): number {
    return this.budget();
  }
}