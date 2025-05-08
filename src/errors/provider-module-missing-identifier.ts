import { IProviderModule } from '../types';
import { XInjectionProviderModuleError } from './provider-module.error';

/** Exception which indicates that a module has been initialized without an `identifier`.  */
export class XInjectionProviderModuleMissingIdentifierError extends XInjectionProviderModuleError {
  name = XInjectionProviderModuleMissingIdentifierError.name;

  constructor(module: IProviderModule) {
    super(module, 'An `identifier` must be supplied!');
  }
}
