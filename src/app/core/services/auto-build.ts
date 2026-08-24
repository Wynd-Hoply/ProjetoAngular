import { inject, Injectable, signal } from '@angular/core';

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
  AutoBuildStatus,
  BuildRecommendation,
} from '../models/auto-build.model';
import { Component, ComponentCategory } from '../models/component.model';

interface PurposeProfile {
  performanceWeights: Record<ComponentCategory, number>;
  budgetShares: Record<ComponentCategory, number>;
  balancePairs: Array<[ComponentCategory, ComponentCategory]>;
}

type Selection = Partial<Record<ComponentCategory, Component>>;
type ExclusionMap = Partial<Record<ComponentCategory, Set<number>>>;

const CATEGORY_ORDER: ComponentCategory[] = ['cpu', 'motherboard', 'ram', 'storage', 'gpu', 'cooler', 'case', 'psu'];

// Quantas vezes tentamos "recomeçar" pela raiz (variando a CPU) se a build
// ficar incompleta. Constante pequena e fixa -> nunca cresce exponencialmente.
const MAX_ROOT_RETRIES = 5;
// Tolerância acima do orçamento "ideal" de uma categoria: a etapa de
// refinamento corrige depois se isso deixar a build cara demais.
const CATEGORY_BUDGET_TOLERANCE = 1.6;
const MAX_REFINEMENT_PASSES = 2;
const MAX_CACHE_ENTRIES = 30;

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

// Erro esperado (orçamento inválido, catálogo incompleto etc.) — distinto de
// um bug real, pra tratamento e mensagens diferentes.
class AutoBuildError extends Error {}

@Injectable({ providedIn: 'root' })
export class AutoBuildService {
  private readonly catalog = inject(CatalogService);
  private readonly builder = inject(BuilderService);
  private readonly compatibility = inject(CompatibilityService);

  // Estado observável pra UI (loading, evitar cliques duplicados etc.)
  readonly status = signal<AutoBuildStatus>('idle');

  // Trava de reentrância: nunca deixa duas gerações rodarem "ao mesmo tempo"
  // (mesmo sendo síncrono, protege contra chamadas recursivas acidentais).
  private generating = false;

  // Cache simples (FIFO/LRU aproximado) por combinação de preferências + tentativa.
  private readonly cache = new Map<string, AutoBuildResult>();

  generateBuild(preferences: AutoBuildPreferences, attempt = 0): AutoBuildResult {
    if (this.generating) {
      return this.errorResult(preferences, 'Já existe uma geração em andamento. Aguarde terminar.');
    }

    const cacheKey = this.cacheKeyFor(preferences, attempt);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    this.generating = true;
    this.status.set('generating');

    try {
      this.validatePreferences(preferences);

      const pools = this.buildSortedPools(preferences);
      this.assertPoolsNotEmpty(pools);

      const reserves = this.minimumPricePerCategory(pools);
      const excluded = this.exclusionsForAttempt(pools, preferences, reserves, attempt);
      const selection = this.constructWithFallback(pools, preferences, reserves, excluded);
      const refined = this.refine(selection, pools, preferences, excluded);

      const result = this.buildResult(refined, preferences, pools, reserves);
      this.status.set(result.feasible ? 'success' : 'infeasible');
      this.cacheStore(cacheKey, result);
      return result;
    } catch (error) {
      this.status.set('error');
      const message = error instanceof AutoBuildError ? error.message : 'Ocorreu um erro inesperado ao gerar a build.';
      return this.errorResult(preferences, message);
    } finally {
      this.generating = false;
    }
  }

  useBuild(result: AutoBuildResult): void {
    if (!result.feasible) return;
    this.builder.load(this.createSnapshot(result.components));
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ---------------------------------------------------------------------
  // FASE 1 — Pools ordenados por eficiência (performance/preço), 1x por categoria.
  // ---------------------------------------------------------------------

  private buildSortedPools(preferences: AutoBuildPreferences): Record<ComponentCategory, Component[]> {
    const cpuPool = this.filterByPreference(this.catalog.getByCategory('cpu'), preferences.cpuPreference, 'cpu');
    const gpuPool = this.filterByPreference(this.catalog.getByCategory('gpu'), preferences.gpuPreference, 'gpu');

    const pools: Record<ComponentCategory, Component[]> = {
      cpu: cpuPool.length > 0 ? cpuPool : this.catalog.getByCategory('cpu'),
      motherboard: this.catalog.getByCategory('motherboard'),
      ram: this.catalog.getByCategory('ram'),
      storage: this.catalog.getByCategory('storage'),
      gpu: gpuPool.length > 0 ? gpuPool : this.catalog.getByCategory('gpu'),
      cooler: this.catalog.getByCategory('cooler'),
      case: this.catalog.getByCategory('case'),
      psu: this.catalog.getByCategory('psu'),
    };

    for (const category of CATEGORY_ORDER) {
      pools[category] = [...pools[category]].sort((a, b) => this.efficiency(b) - this.efficiency(a));
    }

    return pools;
  }

  private efficiency(component: Component): number {
    return component.performanceScore / Math.max(component.price, 1);
  }

  private minimumPricePerCategory(pools: Record<ComponentCategory, Component[]>): Record<ComponentCategory, number> {
    const result = {} as Record<ComponentCategory, number>;
    for (const category of CATEGORY_ORDER) {
      result[category] = pools[category].reduce((min, item) => Math.min(min, item.price), Infinity);
    }
    return result;
  }

  private assertPoolsNotEmpty(pools: Record<ComponentCategory, Component[]>): void {
    const empty = CATEGORY_ORDER.filter((category) => pools[category].length === 0);
    if (empty.length > 0) {
      throw new AutoBuildError(`O catálogo não tem produtos cadastrados para: ${empty.join(', ')}.`);
    }
  }

  // ---------------------------------------------------------------------
  // FASE 2 — Construção gulosa com reserva de orçamento e fallback limitado.
  // ---------------------------------------------------------------------

  private constructWithFallback(
    pools: Record<ComponentCategory, Component[]>,
    preferences: AutoBuildPreferences,
    reserves: Record<ComponentCategory, number>,
    excluded: ExclusionMap,
  ): Selection {
    const cpuCandidates = pools.cpu.filter((cpu) => !excluded.cpu?.has(cpu.id)).slice(0, MAX_ROOT_RETRIES);
    const attempts = cpuCandidates.length > 0 ? cpuCandidates : [undefined];

    let lastAttempt: Selection = {};

    for (const forcedCpu of attempts) {
      const selection = this.constructGreedy(pools, preferences, reserves, excluded, forcedCpu);
      lastAttempt = selection;
      if (this.isSelectionComplete(selection)) {
        return selection;
      }
    }

    // Nenhuma das melhores CPUs fechou uma build completa — devolve a última
    // tentativa; o chamador identifica que está incompleta e trata como inviável.
    return lastAttempt;
  }

  private constructGreedy(
    pools: Record<ComponentCategory, Component[]>,
    preferences: AutoBuildPreferences,
    reserves: Record<ComponentCategory, number>,
    excluded: ExclusionMap,
    forcedCpu?: Component,
  ): Selection {
    const profile = PURPOSE_PROFILES[preferences.purpose];
    const selection: Selection = {};
    let remainingBudget = preferences.budget;

    for (let index = 0; index < CATEGORY_ORDER.length; index++) {
      const category = CATEGORY_ORDER[index];

      if (category === 'cpu' && forcedCpu) {
        selection.cpu = forcedCpu;
        remainingBudget -= forcedCpu.price;
        continue;
      }

      // Reserva o mínimo necessário pras categorias que ainda faltam, pra não
      // gastar o orçamento inteiro logo nas primeiras categorias.
      const reserveForRest = CATEGORY_ORDER.slice(index + 1).reduce((sum, next) => sum + reserves[next], 0);
      const idealBudget = preferences.budget * profile.budgetShares[category];
      const affordable = Math.max(0, remainingBudget - reserveForRest);
      const categoryCap = Math.min(idealBudget * CATEGORY_BUDGET_TOLERANCE, affordable);

      const pick = this.pickForCategory(pools[category], category, categoryCap, selection, excluded[category]);
      if (pick) {
        selection[category] = pick;
        remainingBudget -= pick.price;
      }
    }

    return selection;
  }

  private pickForCategory(
    pool: Component[],
    category: ComponentCategory,
    budgetCap: number,
    currentSelection: Selection,
    excludedIds: Set<number> | undefined,
  ): Component | undefined {
    let bestOverall: Component | undefined;

    // Pool já ordenado por eficiência desc: o primeiro compatível que cabe
    // no teto de orçamento já é a melhor escolha -> não precisa varrer tudo.
    for (const candidate of pool) {
      if (excludedIds?.has(candidate.id)) continue;
      if (!this.isCompatibleWithSelection(candidate, category, currentSelection)) continue;

      bestOverall ??= candidate;
      if (candidate.price <= budgetCap) {
        return candidate;
      }
    }

    return bestOverall;
  }

  private isCompatibleWithSelection(candidate: Component, category: ComponentCategory, selection: Selection): boolean {
    const tentative = { ...selection, [category]: candidate };
    return !this.compatibility.evaluateSelection(tentative).some((check) => check.status === 'incompatible');
  }

  private isSelectionComplete(selection: Selection): boolean {
    return CATEGORY_ORDER.every((category) => selection[category] !== undefined);
  }

  // ---------------------------------------------------------------------
  // FASE 3 — Refinamento local: troca peças por opções melhores se sobrar orçamento.
  // ---------------------------------------------------------------------

  private refine(selection: Selection, pools: Record<ComponentCategory, Component[]>, preferences: AutoBuildPreferences, excluded: ExclusionMap): Selection {
    if (!this.isSelectionComplete(selection)) {
      return selection; // nada pra refinar numa build incompleta
    }

    let current: Selection = { ...selection };
    let currentTotal = this.totalOf(current);

    for (let pass = 0; pass < MAX_REFINEMENT_PASSES; pass++) {
      let improved = false;

      for (const category of CATEGORY_ORDER) {
        const currentComponent = current[category]!;
        const remainingBudget = preferences.budget - currentTotal + currentComponent.price;

        for (const candidate of pools[category]) {
          if (candidate.id === currentComponent.id) break; // pool ordenado: nada depois é melhor
          if (excluded[category]?.has(candidate.id)) continue;
          if (candidate.price > remainingBudget) continue;

          const withoutCurrent: Selection = { ...current, [category]: undefined };
          if (!this.isCompatibleWithSelection(candidate, category, withoutCurrent)) continue;

          current = { ...current, [category]: candidate };
          currentTotal = currentTotal - currentComponent.price + candidate.price;
          improved = true;
          break;
        }
      }

      if (!improved) break; // convergiu, não precisa das passes restantes
    }

    return current;
  }

  private totalOf(selection: Selection): number {
    return CATEGORY_ORDER.reduce((sum, category) => sum + (selection[category]?.price ?? 0), 0);
  }

  // ---------------------------------------------------------------------
  // "Refazer": em vez de reprocessar tudo, reconstrói (barato) excluindo o
  // que já foi sugerido nas tentativas anteriores.
  // ---------------------------------------------------------------------

  private exclusionsForAttempt(
    pools: Record<ComponentCategory, Component[]>,
    preferences: AutoBuildPreferences,
    reserves: Record<ComponentCategory, number>,
    attempt: number,
  ): ExclusionMap {
    if (attempt <= 0) return {};

    const excluded: ExclusionMap = {};
    for (const category of CATEGORY_ORDER) excluded[category] = new Set();

    for (let i = 0; i < attempt; i++) {
      const previous = this.constructWithFallback(pools, preferences, reserves, excluded);
      for (const category of CATEGORY_ORDER) {
        const component = previous[category];
        if (component) excluded[category]!.add(component.id);
      }
    }

    return excluded;
  }

  // ---------------------------------------------------------------------
  // Montagem do resultado final + scoring (fórmulas de domínio inalteradas).
  // ---------------------------------------------------------------------

  private buildResult(selection: Selection, preferences: AutoBuildPreferences, pools: Record<ComponentCategory, Component[]>, reserves: Record<ComponentCategory, number>): AutoBuildResult {
    if (!this.isSelectionComplete(selection)) {
      const minimumRequiredBudget = this.estimateMinimumBudget(pools);
      return {
        ...this.errorResult(
          preferences,
          minimumRequiredBudget > 0
            ? `Nenhuma configuração completa e compatível coube no orçamento. Orçamento mínimo estimado: ${this.formatCurrency(minimumRequiredBudget)}.`
            : 'Não foi possível encontrar uma configuração completa e compatível no catálogo atual.',
        ),
        minimumRequiredBudget,
      };
    }

    const components = CATEGORY_ORDER.map((category) => selection[category]!);
    const total = components.reduce((sum, component) => sum + component.price, 0);
    const profile = PURPOSE_PROFILES[preferences.purpose];

    const score = this.scoreSelection(selection, components, total, preferences, profile);
    const compatibilityChecks = this.compatibility.evaluateSelection(selection);
    const estimatedConsumption = this.compatibility.estimatedConsumptionFor(selection);
    const recommendedWattage = this.compatibility.recommendedWattageFor(selection);

    return {
      preferences,
      components: selection,
      recommendations: this.createRecommendations(selection, preferences),
      total,
      estimatedConsumption,
      recommendedWattage,
      budgetUsedPercent: preferences.budget > 0 ? (total / preferences.budget) * 100 : 0,
      compatibilityChecks,
      compatible: compatibilityChecks.every((check) => check.status !== 'incompatible'),
      score,
      summary: this.createSummary(selection, preferences, total, estimatedConsumption, recommendedWattage),
      minimumRequiredBudget: total,
      feasible: true,
      message: 'Build gerada com sucesso.',
      status: 'success',
    };
  }

  // Estimativa barata de "orçamento mínimo": monta a build mais barata possível
  // (ignorando budgetShares), só pra dar um número de referência ao usuário.
  private estimateMinimumBudget(pools: Record<ComponentCategory, Component[]>): number {
    const selection: Selection = {};
    for (const category of CATEGORY_ORDER) {
      const cheapest = [...pools[category]]
        .sort((a, b) => a.price - b.price)
        .find((candidate) => this.isCompatibleWithSelection(candidate, category, selection));
      if (cheapest) selection[category] = cheapest;
    }
    return this.isSelectionComplete(selection) ? this.totalOf(selection) : 0;
  }

  private scoreSelection(selection: Selection, components: Component[], total: number, preferences: AutoBuildPreferences, profile: PurposeProfile): number {
    const performanceScore = components.reduce((score, c) => score + c.performanceScore * profile.performanceWeights[c.category], 0);
    const valueScore = components.reduce((score, c) => score + (c.performanceScore / Math.max(c.price, 1)) * 100 * profile.performanceWeights[c.category], 0);
    const budgetFitScore = this.calculateBudgetFit(components, preferences.budget, profile);
    const balancePenalty = this.calculateBalancePenalty(selection, profile);
    const priorityScore = this.calculatePriorityScore(total, preferences.budget, preferences.priority);
    const preferenceBonus = this.calculatePreferenceBonus(selection, preferences);

    return performanceScore * 1.6 + valueScore + budgetFitScore + priorityScore + preferenceBonus - balancePenalty;
  }

  private calculateBudgetFit(components: Component[], budget: number, profile: PurposeProfile): number {
    if (budget <= 0) return 0;
    return components.reduce((score, component) => {
      const actualShare = component.price / budget;
      const idealShare = profile.budgetShares[component.category];
      return score + Math.max(0, 18 - Math.abs(actualShare - idealShare) * 120);
    }, 0);
  }

  private calculatePriorityScore(total: number, budget: number, priority: AutoBuildPriority | undefined): number {
    if (budget <= 0) return 0;
    const utilization = total / budget;
    switch (priority) {
      case 'performance': return Math.max(0, utilization * 30);
      case 'economy': return Math.max(0, (1.05 - utilization) * 40);
      case 'value':
      default: return Math.max(0, (1 - Math.abs(utilization - 0.9)) * 35);
    }
  }

  private calculatePreferenceBonus(selection: Selection, preferences: AutoBuildPreferences): number {
    let bonus = 0;
    if (preferences.cpuPreference && preferences.cpuPreference !== 'any' && selection.cpu?.brand.toLowerCase() === preferences.cpuPreference) bonus += 18;
    if (preferences.gpuPreference && preferences.gpuPreference !== 'any' && selection.gpu?.brand.toLowerCase() === preferences.gpuPreference) bonus += 18;
    return bonus;
  }

  private calculateBalancePenalty(selection: Selection, profile: PurposeProfile): number {
    const { cpu, gpu, ram, storage } = selection;
    let penalty = 0;

    for (const [first, second] of profile.balancePairs) {
      const a = selection[first];
      const b = selection[second];
      if (!a || !b) continue;
      penalty += Math.abs(a.performanceScore * profile.performanceWeights[first] - b.performanceScore * profile.performanceWeights[second]) * 0.35;
    }

    if (cpu && gpu) penalty += Math.abs(cpu.performanceScore - gpu.performanceScore) * 0.25;
    if (cpu && ram) penalty += Math.abs(cpu.performanceScore - ram.performanceScore) * 0.12;
    if (cpu && storage) penalty += Math.abs(cpu.performanceScore - storage.performanceScore) * 0.08;

    return penalty;
  }

  private createRecommendations(selection: Selection, preferences: AutoBuildPreferences): BuildRecommendation[] {
    const profile = PURPOSE_PROFILES[preferences.purpose];
    return CATEGORY_ORDER.map((category) => selection[category])
      .filter((component): component is Component => component !== undefined)
      .map((component) => ({
        category: component.category,
        component,
        score: component.performanceScore * profile.performanceWeights[component.category],
        reason: this.getRecommendationReason(component, preferences),
      }));
  }

  private createSummary(selection: Selection, preferences: AutoBuildPreferences, total: number, estimatedConsumption: number, recommendedWattage: number): string[] {
    const { cpu, gpu, ram, storage } = selection;
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
    const base = this.getPurposeReason(preferences.purpose);
    const brand = this.getBrandReason(component.category, preferences);
    return brand ? `${base} ${brand}` : base;
  }

  private getPurposeReason(purpose: AutoBuildPurpose): string {
    switch (purpose) {
      case 'gaming': return 'Boa escolha para gaming, priorizando GPU e CPU.';
      case 'work': return 'Boa escolha para trabalho, priorizando CPU, RAM e armazenamento.';
      case 'editing': return 'Boa escolha para edição e criação, equilibrando CPU, GPU, RAM e storage.';
      case 'study': return 'Boa escolha para estudos, com foco em custo-benefício.';
      case 'general':
      default: return 'Boa escolha para uso geral, equilibrando desempenho e preço.';
    }
  }

  private getBrandReason(category: ComponentCategory, preferences: AutoBuildPreferences): string {
    if (category === 'cpu' && preferences.cpuPreference && preferences.cpuPreference !== 'any') return 'Atende à preferência de processador.';
    if (category === 'gpu' && preferences.gpuPreference && preferences.gpuPreference !== 'any') return 'Atende à preferência de placa de vídeo.';
    return '';
  }

  private filterByPreference(components: Component[], preference: AutoBuildCpuPreference | AutoBuildGpuPreference | undefined, category: 'cpu' | 'gpu'): Component[] {
    if (!preference || preference === 'any') return components;
    const brand = category === 'cpu' ? (preference === 'amd' ? 'AMD' : 'Intel') : (preference === 'nvidia' ? 'NVIDIA' : 'AMD');
    return components.filter((component) => component.brand.toLowerCase() === brand.toLowerCase());
  }

  private createSnapshot(components: Selection): Partial<Record<ComponentCategory, number>> {
    return Object.entries(components).reduce<Partial<Record<ComponentCategory, number>>>((snapshot, [category, component]) => {
      if (component) snapshot[category as ComponentCategory] = component.id;
      return snapshot;
    }, {});
  }

  private validatePreferences(preferences: AutoBuildPreferences): void {
    if (!preferences || typeof preferences.budget !== 'number' || !Number.isFinite(preferences.budget) || preferences.budget <= 0) {
      throw new AutoBuildError('Informe um orçamento numérico maior que zero.');
    }
    if (!PURPOSE_PROFILES[preferences.purpose]) {
      throw new AutoBuildError('Finalidade de uso inválida.');
    }
  }

  private errorResult(preferences: AutoBuildPreferences, message: string): AutoBuildResult {
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
      summary: [message],
      minimumRequiredBudget: 0,
      feasible: false,
      message,
      status: this.status(),
    };
  }

  private cacheKeyFor(preferences: AutoBuildPreferences, attempt: number): string {
    return JSON.stringify({ ...preferences, attempt });
  }

  private cacheStore(key: string, result: AutoBuildResult): void {
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, result);
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private purposeLabel(purpose: AutoBuildPurpose): string {
    switch (purpose) {
      case 'gaming': return 'gaming';
      case 'work': return 'trabalho';
      case 'study': return 'estudos';
      case 'editing': return 'edição e criação';
      case 'general':
      default: return 'uso geral';
    }
  }
}