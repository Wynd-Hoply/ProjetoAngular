import { Component, ComponentCategory } from './component.model';
import { CompatibilityCheck } from '../services/compatibility';

export interface AutoBuildPreferences {
  budget: number;
  purpose: AutoBuildPurpose;
  cpuPreference?: AutoBuildCpuPreference;
  gpuPreference?: AutoBuildGpuPreference;
  priority?: AutoBuildPriority;
}

export interface BuildRecommendation {
  category: ComponentCategory;
  component: Component;
  score: number;
  reason: string;
}

export interface AutoBuildResult {
  preferences: AutoBuildPreferences;
  components: Partial<Record<ComponentCategory, Component>>;
  recommendations: BuildRecommendation[];
  total: number;
  estimatedConsumption: number;
  recommendedWattage: number;
  budgetUsedPercent: number;
  compatibilityChecks: CompatibilityCheck[];
  compatible: boolean;
  score: number;
  summary: string[];
  minimumRequiredBudget: number;
  feasible: boolean;
  message: string;
}
  
export type AutoBuildPurpose = 'gaming' | 'work' | 'study' | 'editing' | 'general';
export type AutoBuildCpuPreference = 'amd' | 'intel' | 'any';
export type AutoBuildGpuPreference = 'nvidia' | 'amd' | 'any';
export type AutoBuildPriority = 'performance' | 'value' | 'economy';
export type AutoBuildStatus = 'idle' | 'generating' | 'success' | 'infeasible' | 'error';

export interface AutoBuildPreferences {
  budget: number;
  purpose: AutoBuildPurpose;
  cpuPreference?: AutoBuildCpuPreference;
  gpuPreference?: AutoBuildGpuPreference;
  priority?: AutoBuildPriority;
}

export interface BuildRecommendation {
  category: ComponentCategory;
  component: Component;
  score: number;
  reason: string;
}

export interface AutoBuildResult {
  preferences: AutoBuildPreferences;
  components: Partial<Record<ComponentCategory, Component>>;
  recommendations: BuildRecommendation[];
  total: number;
  estimatedConsumption: number;
  recommendedWattage: number;
  budgetUsedPercent: number;
  compatibilityChecks: CompatibilityCheck[];
  compatible: boolean;
  score: number;
  summary: string[];
  minimumRequiredBudget: number;
  feasible: boolean;
  message: string;
  status: AutoBuildStatus;
}