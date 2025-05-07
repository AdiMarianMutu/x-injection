import { tagged as _tagged, type MetadataTag } from 'inversify';

/** See {@link https://inversify.io/docs/api/decorator/#tagged} for more details. */
export function Tagged(key: MetadataTag, value: unknown) {
  return _tagged(key, value);
}
