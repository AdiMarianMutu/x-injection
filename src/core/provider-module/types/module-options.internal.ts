import type { Container } from 'inversify';

import type { ProviderModuleOptions } from './module-options';
import { IProviderModule } from './provider-module.interfaces';

export interface ProviderModuleOptionsInternal extends ProviderModuleOptions {
  /** Overwrite the internal reference to the `AppModule`. */
  appModuleRef?: IProviderModule;

  inversify?: {
    /** Overwrite the `Inversify` parent container.  */
    parentContainer?: Container;
  };
}
