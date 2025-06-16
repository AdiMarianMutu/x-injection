import type { IProviderModule } from '../core';
import { ProviderTokenHelpers } from '../helpers';
import type { ProviderToken } from '../types';
import { InjectionProviderModuleError } from './provider-module.error';

/** Exception which indicates that an `unknown` type of {@link ProviderToken} has been supplied.  */
export class InjectionProviderModuleUnknownProviderError extends InjectionProviderModuleError {
  override name = InjectionProviderModuleUnknownProviderError.name;

  constructor(module: IProviderModule, providerToken: ProviderToken) {
    super(module, `The [${ProviderTokenHelpers.providerTokenToString(providerToken)}] provider is of an unknown type!`);
  }
}
