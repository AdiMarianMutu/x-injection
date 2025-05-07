import { IProviderModule } from '../types';
import { XInjectionProviderModuleError } from './provider-module.error';

export class XInjectionProviderModuleDisposedError extends XInjectionProviderModuleError {
  name = XInjectionProviderModuleDisposedError.name;

  constructor(module: IProviderModule) {
    super(module, 'Has been disposed! You can re-initialize it by using the `_lazyInit` method.');
  }
}
