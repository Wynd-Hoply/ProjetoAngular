import { inject, Injectable } from '@angular/core';

import { BuilderService } from './builder';
import { CatalogService } from './catalog';
import { CompatibilityService } from './compatibility';
import {
  AutoBuildCpuPreference,
  AutoBuildGpuPreference,
  AutoBuildPreferences,
  AutoBuildPriority,
  AutoBuildPurpose,
  AutoBuildResult,
  BuildRecommendation,
} from '../models/auto-build.model';
import { Component, ComponentCategory } from '../models/component.model';

interface BuildCandidate {
  components: Partial<Record<ComponentCategory, Component>>;
  total: number;
  score: number;
}

interface PurposeProfile {
  performanceWeights: Record<ComponentCategory, number>;
  budgetShares: Record<ComponentCategory, number>;
  balancePairs: Array<[ComponentCategory, ComponentCategory]>;
}

const CATEGORY_ORDER: ComponentCategory[] = ['cpu', 'motherboard', 'ram', 'storage', 'gpu', 'cooler', 'case', 'psu'];

const PURPOSE_PROFILES: Record<AutoBuildPurpose, PurposeProfile> = {
  gaming: {
    performanceWeights: { cpu: 1.15, gpu: 1.7, motherboard: 0.75, ram: 0.9, storage: 0.7, psu: 0.4, case: 0.3, cooler: 0.55 },
    budgetShares: { cpu: 0.2, gpu: 0.32, motherboard: 0.12, ram: 0.12, storage: 0.08, psu: 0.05, case: 0.05, cooler: 0.06 },
    balancePairs: [['cpu', 'gpu'], ['cpu', 'ram']],
  },
  work: {
    performanceWeights: { cpu: 1.55, gpu: 0.5, motherboard: 0.9, ram: 1.3, storage: 1.1, psu: 0.45, case: 0.35, cooler: 0.6 },
    budgetShares: { cpu: 0.28, gpu: 0.08, motherboard: 0.12, ram: 0.2, storage: 0.16, psu: 0.05, case: 0.04, cooler: 0.07 },
    balancePairs: [['cpu', 'ram'], ['cpu', 'storage']],
  },
  study: {
    performanceWeights: { cpu: 1.2, gpu: 0.45, motherboard: 0.9, ram: 1.1, storage: 1.0, psu: 0.45, case: 0.45, cooler: 0.5 },
    budgetShares: { cpu: 0.24, gpu: 0.1, motherboard: 0.14, ram: 0.16, storage: 0.16, psu: 0.06, case: 0.08, cooler: 0.06 },
    balancePairs: [['cpu', 'ram'], ['cpu', 'storage']],
  },
  editing: {
    performanceWeights: { cpu: 1.45, gpu: 1.2, motherboard: 0.9, ram: 1.35, storage: 1.1, psu: 0.45, case: 0.35, cooler: 0.6 },
    budgetShares: { cpu: 0.26, gpu: 0.2, motherboard: 0.12, ram: 0.18, storage: 0.14, psu: 0.05, case: 0.04, cooler: 0.05 },
    balancePairs: [['cpu', 'gpu'], ['cpu', 'ram'], ['cpu', 'storage']],
  },
  general: {
    performanceWeights: { cpu: 1.1, gpu: 0.7, motherboard: 0.95, ram: 1.0, storage: 1.0, psu: 0.5, case: 0.5, cooler: 0.55 },
    budgetShares: { cpu: 0.2, gpu: 0.12, motherboard: 0.15, ram: 0.15, storage: 0.15, psu: 0.08, case: 0.08, cooler: 0.07 },
    balancePairs: [['cpu', 'gpu'], ['cpu', 'ram'], ['cpu', 'storage']],
  },
};

@Injectable({ providedIn: 'root' })
export class AutoBuildService {
  private readonly catalog = inject(CatalogService);
  private readonly builder = inject(BuilderService);
  private readonly compatibility = inject(CompatibilityService);

  generateBuild(preferences: AutoBuildPreferences, attempt = 0): AutoBuildResult {
    const pools = this.createPools(preferences);
    const candidates = this.findCandidates(pools, preferences);
    const minimumRequiredBudget = candidates.length > 0 ? Math.min(...candidates.map((candidate) => candidate.total)) : 0;
    const feasibleCandidates = candidates.filter((candidate) => candidate.total <= preferences.budget);

    if (feasibleCandidates.length === 0) {
      return {
        preferences,
        components: {},
        recommendations: [],
        total: 0,
        estimatedConsumption: 0,
        recommendedWattage: 0,
        budgetUsedPercent: 0,
        compatibilityChecks: [],
        compatible: false,
        score: 0,
        summary: [
          'Nenhuma build completa cabe no orçamento informado com o catálogo atual.',
          `Orçamento mínimo estimado para uma configuração completa: ${this.formatCurrency(minimumRequiredBudget)}.`,
        ],
        minimumRequiredBudget,
        feasible: false,
        message: 'O orçamento informado está abaixo do mínimo necessário para montar uma configuração completa.',
      };
    }

    feasibleCandidates.sort((first, second) => second.score - first.score || second.total - first.total);
    const chosen = feasibleCandidates[Math.min(attempt, feasibleCandidates.length - 1)];
    const compatibilityChecks = this.compatibility.evaluateSelection(chosen.components);
    const estimatedConsumption = this.compatibility.estimatedConsumptionFor(chosen.components);
    const recommendedWattage = this.compatibility.recommendedWattageFor(chosen.components);

    return {
      preferences,
      components: chosen.components,
      recommendations: this.createRecommendations(chosen.components, preferences),
      total: chosen.total,
      estimatedConsumption,
      recommendedWattage,
      budgetUsedPercent: preferences.budget > 0 ? (chosen.total / preferences.budget) * 100 : 0,
      compatibilityChecks,
      compatible: compatibilityChecks.every((check) => check.status !== 'incompatible'),
      score: chosen.score,
      summary: this.createSummary(chosen.components, preferences, chosen.total, estimatedConsumption, recommendedWattage),
      minimumRequiredBudget,
      feasible: true,
      message: 'Build gerada com sucesso.',
    };
  }

  useBuild(result: AutoBuildResult): void {
    this.builder.load(this.createSnapshot(result.components));
  }

  private createPools(preferences: AutoBuildPreferences): Record<ComponentCategory, Component[]> {
    const cpuPool = this.filterByPreference(this.catalog.getByCategory('cpu'), preferences.cpuPreference, 'cpu');
    const gpuPool = this.filterByPreference(this.catalog.getByCategory('gpu'), preferences.gpuPreference, 'gpu');

    return {
      cpu: cpuPool.length > 0 ? cpuPool : this.catalog.getByCategory('cpu'),
      motherboard: this.catalog.getByCategory('motherboard'),
      ram: this.catalog.getByCategory('ram'),
      storage: this.catalog.getByCategory('storage'),
      gpu: gpuPool.length > 0 ? gpuPool : this.catalog.getByCategory('gpu'),
      cooler: this.catalog.getByCategory('cooler'),
      case: this.catalog.getByCategory('case'),
      psu: this.catalog.getByCategory('psu'),
    };
  }

  private findCandidates(pools: Record<ComponentCategory, Component[]>, preferences: AutoBuildPreferences): BuildCandidate[] {
    const candidates: BuildCandidate[] = [];

    const walk = (index: number, current: Partial<Record<ComponentCategory, Component>>): void => {
      if (index >= CATEGORY_ORDER.length) {
        const candidate = this.evaluateCandidate(current, preferences);
        if (candidate) {
          candidates.push(candidate);
        }
        return;
      }

      const category = CATEGORY_ORDER[index];
      for (const component of pools[category]) {
        const nextSelection = { ...current, [category]: component } as Partial<Record<ComponentCategory, Component>>;
        const checks = this.compatibility.evaluateSelection(nextSelection);
        if (checks.some((check) => check.status === 'incompatible')) {
          continue;
        }

        walk(index + 1, nextSelection);
      }
    };

    walk(0, {});
    return candidates;
  }

  private evaluateCandidate(components: Partial<Record<ComponentCategory, Component>>, preferences: AutoBuildPreferences): BuildCandidate | null {
    const selectedComponents = CATEGORY_ORDER.map((category) => components[category]).filter((component): component is Component => component !== undefined);
    if (selectedComponents.length !== CATEGORY_ORDER.length) {
      return null;
    }

    const total = selectedComponents.reduce((sum, component) => sum + component.price, 0);
    const profile = PURPOSE_PROFILES[preferences.purpose];
    const performanceScore = selectedComponents.reduce((score, component) => score + component.performanceScore * profile.performanceWeights[component.category], 0);
    const valueScore = selectedComponents.reduce((score, component) => score + (component.performanceScore / Math.max(component.price, 1)) * 100 * profile.performanceWeights[component.category], 0);
    const budgetFitScore = this.calculateBudgetFit(selectedComponents, preferences.budget, profile);
    const balancePenalty = this.calculateBalancePenalty(components, profile);
    const priorityScore = this.calculatePriorityScore(total, preferences.budget, preferences.priority);
    const preferenceBonus = this.calculatePreferenceBonus(components, preferences);

    return {
      components,
      total,
      score: performanceScore * 1.6 + valueScore + budgetFitScore + priorityScore + preferenceBonus - balancePenalty,
    };
  }

  private calculateBudgetFit(components: Component[], budget: number, profile: PurposeProfile): number {
    if (budget <= 0) {
      return 0;
    }

    return components.reduce((score, component) => {
      const actualShare = component.price / budget;
      const idealShare = profile.budgetShares[component.category];
      const delta = Math.abs(actualShare - idealShare);
      return score + Math.max(0, 18 - delta * 120);
    }, 0);
  }

  private calculatePriorityScore(total: number, budget: number, priority: AutoBuildPriority | undefined): number {
    if (budget <= 0) {
      return 0;
    }

    const utilization = total / budget;
    switch (priority) {
      case 'performance':
        return Math.max(0, utilization * 30);
      case 'economy':
        return Math.max(0, (1.05 - utilization) * 40);
      case 'value':
      default:
        return Math.max(0, (1 - Math.abs(utilization - 0.9)) * 35);
    }
  }

  private calculatePreferenceBonus(components: Partial<Record<ComponentCategory, Component>>, preferences: AutoBuildPreferences): number {
    let bonus = 0;

    if (preferences.cpuPreference && preferences.cpuPreference !== 'any' && components.cpu?.brand.toLowerCase() === preferences.cpuPreference) {
      bonus += 18;
    }

    if (preferences.gpuPreference && preferences.gpuPreference !== 'any' && components.gpu?.brand.toLowerCase() === preferences.gpuPreference) {
      bonus += 18;
    }

    return bonus;
  }

  private calculateBalancePenalty(components: Partial<Record<ComponentCategory, Component>>, profile: PurposeProfile): number {
    const cpu = components.cpu;
    const gpu = components.gpu;
    const ram = components.ram;
    const storage = components.storage;

    let penalty = 0;

    for (const [firstCategory, secondCategory] of profile.balancePairs) {
      const first = components[firstCategory];
      const second = components[secondCategory];
      if (!first || !second) {
        continue;
      }

      const firstValue = first.performanceScore * profile.performanceWeights[firstCategory];
      const secondValue = second.performanceScore * profile.performanceWeights[secondCategory];
      penalty += Math.abs(firstValue - secondValue) * 0.35;
    }

    if (cpu && gpu) {
      penalty += Math.abs(cpu.performanceScore - gpu.performanceScore) * 0.25;
    }

    if (cpu && ram) {
      penalty += Math.abs(cpu.performanceScore - ram.performanceScore) * 0.12;
    }

    if (cpu && storage) {
      penalty += Math.abs(cpu.performanceScore - storage.performanceScore) * 0.08;
    }

    return penalty;
  }

  private createRecommendations(components: Partial<Record<ComponentCategory, Component>>, preferences: AutoBuildPreferences): BuildRecommendation[] {
    const profile = PURPOSE_PROFILES[preferences.purpose];

    return CATEGORY_ORDER.map((category) => components[category]).filter((component): component is Component => component !== undefined).map((component) => ({
      category: component.category,
      component,
      score: component.performanceScore * profile.performanceWeights[component.category],
      reason: this.getRecommendationReason(component, preferences),
    }));
  }

  private createSummary(components: Partial<Record<ComponentCategory, Component>>, preferences: AutoBuildPreferences, total: number, estimatedConsumption: number, recommendedWattage: number): string[] {
    const cpu = components.cpu;
    const gpu = components.gpu;
    const ram = components.ram;
    const storage = components.storage;

    return [
      `Build equilibrada para ${this.purposeLabel(preferences.purpose)}.`,
      `Orçamento utilizado: ${this.formatCurrency(total)} de ${this.formatCurrency(preferences.budget)}.`,
      `Consumo estimado: ${estimatedConsumption} W. Fonte recomendada: ${recommendedWattage} W.`,
      cpu && gpu ? `Equilíbrio principal entre CPU ${cpu.name} e GPU ${gpu.name}.` : undefined,
      ram ? `RAM selecionada: ${ram.specifications.capacityGB ?? 'n/i'} GB.` : undefined,
      storage ? `Armazenamento selecionado: ${storage.specifications.capacityGB ?? 'n/i'} GB.` : undefined,
    ].filter((value): value is string => value !== undefined);
  }

  private getRecommendationReason(component: Component, preferences: AutoBuildPreferences): string {
    const baseReason = this.getPurposeReason(preferences.purpose);
    const brandReason = this.getBrandReason(component.category, preferences);
    return brandReason ? `${baseReason} ${brandReason}` : baseReason;
  }

  private getPurposeReason(purpose: AutoBuildPurpose): string {
    switch (purpose) {
      case 'gaming':
        return 'Boa escolha para gaming, priorizando GPU e CPU.';
      case 'work':
        return 'Boa escolha para trabalho, priorizando CPU, RAM e armazenamento.';
      case 'editing':
        return 'Boa escolha para edição e criação, equilibrando CPU, GPU, RAM e storage.';
      case 'study':
        return 'Boa escolha para estudos, com foco em custo-benefício.';
      case 'general':
      default:
        return 'Boa escolha para uso geral, equilibrando desempenho e preço.';
    }
  }

  private getBrandReason(category: ComponentCategory, preferences: AutoBuildPreferences): string {
    if (category === 'cpu' && preferences.cpuPreference && preferences.cpuPreference !== 'any') {
      return 'Atende à preferência de processador.';
    }

    if (category === 'gpu' && preferences.gpuPreference && preferences.gpuPreference !== 'any') {
      return 'Atende à preferência de placa de vídeo.';
    }

    return '';
  }

  private filterByPreference(components: Component[], preference: AutoBuildCpuPreference | AutoBuildGpuPreference | undefined, category: 'cpu' | 'gpu'): Component[] {
    if (!preference || preference === 'any') {
      return components;
    }

    const brand = category === 'cpu'
      ? preference === 'amd'
        ? 'AMD'
        : 'Intel'
      : preference === 'nvidia'
        ? 'NVIDIA'
        : 'AMD';

    return components.filter((component) => component.brand.toLowerCase() === brand.toLowerCase());
  }

  private createSnapshot(components: Partial<Record<ComponentCategory, Component>>): Partial<Record<ComponentCategory, number>> {
    return Object.entries(components).reduce<Partial<Record<ComponentCategory, number>>>((snapshot, [category, component]) => {
      if (component) {
        snapshot[category as ComponentCategory] = component.id;
      }
      return snapshot;
    }, {});
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private purposeLabel(purpose: AutoBuildPurpose): string {
    switch (purpose) {
      case 'gaming':
        return 'gaming';
      case 'work':
        return 'trabalho';
      case 'study':
        return 'estudos';
      case 'editing':
        return 'edição e criação';
      case 'general':
      default:
        return 'uso geral';
    }
  }
}