import type { IProviderModule } from '../core';
import { InjectionProviderModuleError } from './provider-module.error';

/** Exception which indicates that a module has been initialized without an `identifier`.  */
export class InjectionProviderModuleMissingIdentifierError extends InjectionProviderModuleError {
  override name = InjectionProviderModuleMissingIdentifierError.name;

  constructor(module: IProviderModule) {
    super(module, 'An `identifier` must be supplied!');
  }
}
