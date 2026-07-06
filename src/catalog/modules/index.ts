import { registerModules } from '../ModuleCatalog';
import housing from './housing';
import civic from './civic';
import food from './food';
import energy from './energy';
import industry from './industry';
import compute from './compute';
import logistics from './logistics';
import landscape from './landscape';

let registered = false;

/** Register the full module catalog (idempotent). */
export function registerAllModules(): void {
  if (registered) return;
  registered = true;
  registerModules(housing);
  registerModules(civic);
  registerModules(food);
  registerModules(energy);
  registerModules(industry);
  registerModules(compute);
  registerModules(logistics);
  registerModules(landscape);
}
