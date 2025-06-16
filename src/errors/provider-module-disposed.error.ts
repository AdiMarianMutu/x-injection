import type { IProviderModule } from '../core';
import { InjectionProviderModuleError } from './provider-module.error';

/** Exception which indicates an invokation of a disposed module.  */
export class InjectionProviderModuleDisposedError extends InjectionProviderModuleError {
  override name = InjectionProviderModuleDisposedError.name;

  constructor(module: IProviderModule) {
    super(module, 'Has been disposed!');
  }
}
