import {
  injectFromBase as _injectFromBase,
  named as _named,
  optional as _optional,
  tagged as _tagged,
  unmanaged as _unmanaged,
  type MetadataName,
  type MetadataTag,
} from 'inversify';

/** See {@link https://inversify.io/docs/api/decorator/#injectfrombase} for more details. */
export function InjectFromBase(options?: Parameters<typeof _injectFromBase>[0]) {
  return _injectFromBase(options);
}

/** See {@link https://inversify.io/docs/api/decorator/#named} for more details. */
export function Named(name: MetadataName) {
  return _named(name);
}

/** See {@link https://inversify.io/docs/api/decorator/#optional} for more details. */
export function Optional() {
  return _optional();
}

/** See {@link https://inversify.io/docs/api/decorator/#tagged} for more details. */
export function Tagged(key: MetadataTag, value: unknown) {
  return _tagged(key, value);
}

/** See {@link https://inversify.io/docs/api/decorator/#unmanaged} for more details. */
export function Unmanaged() {
  return _unmanaged();
}
