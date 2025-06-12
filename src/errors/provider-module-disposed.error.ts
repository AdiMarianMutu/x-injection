import type { ProviderModuleOrDefinition } from '../types';
import { InjectionProviderModuleError } from './provider-module.error';

/** Exception which indicates an invokation of a disposed module.  */
export class InjectionProviderModuleDisposedError extends InjectionProviderModuleError {
  override name = InjectionProviderModuleDisposedError.name;

  constructor(module: ProviderModuleOrDefinition) {
    super(module, 'Has been disposed! You can re-initialize it by using the `_internalInit` method.');
  }
}
