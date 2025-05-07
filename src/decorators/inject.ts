import { inject as _inject } from 'inversify';

import { ProviderTokenHelpers } from '../helpers';
import type { ProviderToken } from '../types';

/** See {@link https://inversify.io/docs/api/decorator/#inject} for more details. */
export function Inject(provider: ProviderToken) {
  return _inject(ProviderTokenHelpers.toServiceIdentifier(provider));
}
