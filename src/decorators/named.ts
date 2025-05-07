import { named as _named, type MetadataName } from 'inversify';

/** See {@link https://inversify.io/docs/api/decorator/#named} for more details. */
export function Named(name: MetadataName) {
  return _named(name);
}
