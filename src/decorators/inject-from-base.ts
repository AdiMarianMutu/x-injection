import { injectFromBase as _injectFromBase } from 'inversify';

/** See {@link https://inversify.io/docs/api/decorator/#injectfrombase} for more details. */
export function InjectFromBase(options?: Parameters<typeof _injectFromBase>[0]) {
  return _injectFromBase(options);
}
