import type { ProviderModuleOrDefinition } from '../types';
import { InjectionProviderModuleError } from './provider-module.error';

/** Exception which indicates an error with regards to the `isGlobal` option.  */
export class InjectionProviderModuleGlobalMarkError extends InjectionProviderModuleError {
  override name = InjectionProviderModuleGlobalMarkError.name;

  constructor(module: ProviderModuleOrDefinition, message: string) {
    super(module, message);
  }
}
