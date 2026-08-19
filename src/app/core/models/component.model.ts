export type ComponentCategory =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooler';

export interface ComponentSpecifications {
  socket?: string;
  coreCount?: number;
  threadCount?: number;
  baseClockGHz?: number;
  boostClockGHz?: number;
  tdpWatts?: number;
  vramGB?: number;
  memoryType?: string;
  memorySpeedMHz?: number;
  interface?: string;
  chipset?: string;
  formFactor?: string;
  ramType?: 'DDR4' | 'DDR5';
  ramSlots?: number;
  capacityGB?: number;
  readSpeedMBps?: number;
  writeSpeedMBps?: number;
  wattage?: number;
  efficiency?: string;
  modular?: boolean;
  gpuLengthMm?: number;
  radiatorSizeMm?: number;
  coolerHeightMm?: number;
  supportedSockets?: string[];
  supportedFormFactors?: string[];
}

export interface Component {
  id: number;
  name: string;
  category: ComponentCategory;
  brand: string;
  price: number;
  performanceScore: number;
  powerDrawWatts: number;
  image: string;
  specifications: ComponentSpecifications;
}
