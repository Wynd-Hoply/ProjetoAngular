import { ComponentCategory } from './component.model';

export type CatalogSort =
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'performance-desc';

export interface CatalogFilters {
  category?: ComponentCategory;
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minPerformance?: number;
  socket?: string;
  memoryType?: string;
  interface?: string;
  minCapacityGB?: number;
  minVramGB?: number;
  minWattage?: number;
}
