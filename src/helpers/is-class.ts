export function isClass(v: any): boolean {
  return typeof v === 'function' && /^class\s/.test(Function.prototype.toString.call(v));
}
