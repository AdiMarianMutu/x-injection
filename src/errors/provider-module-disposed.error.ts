import { IProviderModule } from '../types';
import { XInjectionProviderModuleError } from './provider-module.error';

/** Exception which indicates an invokation of a disposed module.  */
export class XInjectionProviderModuleDisposedError extends XInjectionProviderModuleError {
  name = XInjectionProviderModuleDisposedError.name;

  constructor(module: IProviderModule) {
    super(module, 'Has been disposed! You can re-initialize it by using the `_lazyInit` method.');
  }
}
