import type { IProviderModule } from '../core';
import { ProviderTokenHelpers } from '../helpers';
import type { ProviderToken } from '../types';
import { InjectionProviderModuleError } from './provider-module.error';

/** Exception which indicates that a module container does not contain the requested provider.  */
export class InjectionProviderModuleMissingProviderError extends InjectionProviderModuleError {
  override name = InjectionProviderModuleMissingProviderError.name;

  constructor(module: IProviderModule, providerToken: ProviderToken) {
    super(
      module,
      `The [${ProviderTokenHelpers.providerTokenToString(providerToken)}] provider is not bound to this (or any imported) module container, and was not found either in the 'AppModule'!`
    );
  }
}
