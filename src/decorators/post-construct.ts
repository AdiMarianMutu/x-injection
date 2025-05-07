import { postConstruct as _postConstruct } from 'inversify';

/** See {@link https://inversify.io/docs/api/decorator/#postconstruct} for more details. */
export function PostConstruct() {
  return _postConstruct();
}
