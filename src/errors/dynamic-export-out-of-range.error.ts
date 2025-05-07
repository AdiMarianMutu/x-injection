import type { IProviderModule } from '../types';
import { XInjectionProviderModuleError } from './provider-module.error';

/**
 * Exception which indicates that an instance of {@link IProviderModule}
 * imports another module which dynamically exports its providers/modules and
 * is trying to dynamically export more or different providers/modules than the
 * ones declared into its static exports.
 */
export class XInjectionDynamicExportsOutOfRange extends XInjectionProviderModuleError {
  name = XInjectionDynamicExportsOutOfRange.name;

  constructor(module: IProviderModule) {
    super(
      module,
      `The 'ProviderModule.${module.toString()}' is trying to dynamically export providers/modules out of the declared range of the static exports!`
    );
  }
}
