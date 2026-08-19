import { computed, inject, Injectable } from '@angular/core';

import { BuilderService } from './builder';
import { Component } from '../models/component.model';

export interface CompatibilityCheck {
  key: string;
  label: string;
  status: 'compatible' | 'incompatible' | 'pending';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class CompatibilityService {
  private readonly builder = inject(BuilderService);

  readonly estimatedConsumption = computed(() => this.builder.selectedComponents()
    .reduce((total, component) => total + component.powerDrawWatts, 0));
  readonly recommendedWattage = computed(() => Math.ceil(this.estimatedConsumption() * 1.2));
  readonly checks = computed(() => this.evaluate(this.builder.selected()));
  readonly hasIncompatibility = computed(() => this.checks().some((check) => check.status === 'incompatible'));
  readonly isCompatible = computed(() => !this.hasIncompatibility() && this.checks().some((check) => check.status === 'compatible'));

  private evaluate(selected: Partial<Record<Component['category'], Component>>): CompatibilityCheck[] {
    const checks: CompatibilityCheck[] = [];
    const cpu = selected.cpu;
    const motherboard = selected.motherboard;
    const ram = selected.ram;
    const cooler = selected.cooler;
    const powerSupply = selected.psu;
    const computerCase = selected.case;

    if (cpu && motherboard) {
      const cpuSocket = cpu.specifications.socket;
      const motherboardSocket = motherboard.specifications.socket;
      checks.push(cpuSocket && motherboardSocket && cpuSocket === motherboardSocket
        ? this.compatible('cpu-motherboard', 'CPU e placa-mãe', `Socket ${cpuSocket} compatível.`)
        : this.incompatible('cpu-motherboard', 'CPU e placa-mãe', `CPU utiliza socket ${cpuSocket ?? 'não informado'}, mas a placa-mãe selecionada utiliza ${motherboardSocket ?? 'socket não informado'}.`));
    }

    if (ram && motherboard) {
      const ramType = ram.specifications.ramType;
      const motherboardRamType = motherboard.specifications.ramType;
      checks.push(ramType && motherboardRamType && ramType === motherboardRamType
        ? this.compatible('ram-motherboard', 'RAM e placa-mãe', `As duas peças utilizam ${ramType}.`)
        : this.incompatible('ram-motherboard', 'RAM e placa-mãe', `A memória utiliza ${ramType ?? 'tipo não informado'}, mas a placa-mãe suporta ${motherboardRamType ?? 'tipo não informado'}.`));
    }

    if (cpu && cooler) {
      const socket = cpu.specifications.socket;
      const supportedSockets = cooler.specifications.supportedSockets ?? [];
      checks.push(socket && supportedSockets.includes(socket)
        ? this.compatible('cpu-cooler', 'CPU e cooler', `O cooler suporta o socket ${socket}.`)
        : this.incompatible('cpu-cooler', 'CPU e cooler', `O cooler não informa suporte ao socket ${socket ?? 'utilizado pela CPU'}.`));
    }

    if (powerSupply) {
      const wattage = powerSupply.specifications.wattage;
      const required = this.recommendedWattage();
      checks.push(wattage !== undefined && wattage >= required
        ? this.compatible('power-supply', 'Fonte e configuração', `Fonte de ${wattage} W; recomendação mínima de ${required} W.`)
        : this.incompatible('power-supply', 'Fonte e configuração', `A configuração recomenda ${required} W, mas a fonte selecionada oferece ${wattage ?? 'potência não informada'} W.`));
    }

    if (computerCase && motherboard) {
      const formFactor = motherboard.specifications.formFactor;
      const supportedFormFactors = computerCase.specifications.supportedFormFactors ?? [];
      checks.push(formFactor && supportedFormFactors.includes(formFactor)
        ? this.compatible('case-motherboard', 'Gabinete e placa-mãe', `O gabinete suporta o formato ${formFactor}.`)
        : this.incompatible('case-motherboard', 'Gabinete e placa-mãe', `A placa-mãe utiliza formato ${formFactor ?? 'não informado'}, não listado como suportado pelo gabinete.`));
    }

    return checks;
  }

  private compatible(key: string, label: string, message: string): CompatibilityCheck {
    return { key, label, status: 'compatible', message };
  }

  private incompatible(key: string, label: string, message: string): CompatibilityCheck {
    return { key, label, status: 'incompatible', message };
  }
}
