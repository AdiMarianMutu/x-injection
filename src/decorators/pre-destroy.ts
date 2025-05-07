import { preDestroy as _preDestroy } from 'inversify';

/** See {@link https://inversify.io/docs/api/decorator/#predestroy} for more details. */
export function PreDestroy() {
  return _preDestroy();
}
