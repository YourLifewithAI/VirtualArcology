import type { Category, ModuleDef } from './types';

const registry = new Map<string, ModuleDef>();

export function registerModules(defs: ModuleDef[]): void {
  for (const def of defs) {
    if (registry.has(def.id)) throw new Error(`Duplicate module id: ${def.id}`);
    registry.set(def.id, def);
  }
}

export function getModule(id: string): ModuleDef | undefined {
  return registry.get(id);
}

export function allModules(): ModuleDef[] {
  return [...registry.values()];
}

export function modulesByCategory(category: Category): ModuleDef[] {
  return allModules().filter((d) => d.category === category);
}
