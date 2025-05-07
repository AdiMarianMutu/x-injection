import { unmanaged as _unmanaged } from 'inversify';

/** See {@link https://inversify.io/docs/api/decorator/#unmanaged} for more details. */
export function Unmanaged() {
  return _unmanaged();
}
