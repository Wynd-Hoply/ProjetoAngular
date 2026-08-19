import { ComponentCategory } from './component.model';

export interface SavedBuild {
  id: string;
  name: string;
  date: string;
  components: Partial<Record<ComponentCategory, number>>;
  total: number;
}