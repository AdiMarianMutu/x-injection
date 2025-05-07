import { multiInject as _multiInject } from 'inversify';

import { ProviderTokenHelpers } from '../helpers';
import type { ProviderToken } from '../types';

/** See {@link https://inversify.io/docs/api/decorator/#multiinject} for more details. */
export function MultiInject(provider: ProviderToken) {
  return _multiInject(ProviderTokenHelpers.toSimpleServiceIdentifier(provider));
}
