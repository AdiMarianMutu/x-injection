import { injectable as _injectable } from 'inversify';

import { InjectionScope } from '../enums';
import { injectionScopeToBindingScope } from '../helpers';

/** See {@link https://inversify.io/docs/api/decorator/#injectable} for more details. */
export function Injectable(scope?: InjectionScope) {
  if (scope === undefined) return _injectable();

  return _injectable(injectionScopeToBindingScope(scope));
}
