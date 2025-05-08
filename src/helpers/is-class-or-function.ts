import type { Class } from 'type-fest';

export function isClassOrFunction(value: any): value is Function | Class<any> {
  return typeof value === 'function';
}
