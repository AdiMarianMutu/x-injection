export function isClass(v: any): boolean {
  if (typeof v !== 'function') return false;

  return Function.prototype.toString.call(v).startsWith('class ');
}
