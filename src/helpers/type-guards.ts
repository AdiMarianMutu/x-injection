/*
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

import type { Class } from 'type-fest';

function isObject(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]';
}

export function isPlainObject(o: any): o is object {
  if (isObject(o) === false) return false;

  // If has modified constructor
  const ctor = o.constructor;
  if (ctor === undefined) return true;

  // If has modified prototype
  const prot = ctor.prototype;
  if (isObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
}

export function isClass(v: any): boolean {
  if (typeof v !== 'function') return false;

  return Function.prototype.toString.call(v).startsWith('class ');
}

export function isClassOrFunction(value: any): value is Function | Class<any> {
  return typeof value === 'function';
}
