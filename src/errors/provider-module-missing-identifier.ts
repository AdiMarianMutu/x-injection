import type { ProviderModuleOrDefinition } from '../types';
import { InjectionProviderModuleError } from './provider-module.error';

/** Exception which indicates that a module has been initialized without an `identifier`.  */
export class InjectionProviderModuleMissingIdentifierError extends InjectionProviderModuleError {
  override name = InjectionProviderModuleMissingIdentifierError.name;

  constructor(module: ProviderModuleOrDefinition) {
    super(module, 'An `identifier` must be supplied!');
  }
}
