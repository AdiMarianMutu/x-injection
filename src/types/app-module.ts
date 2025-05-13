import type { Except } from 'type-fest';

import type { IProviderModule, IProviderModuleNaked, LazyInitOptions } from './provider-module';

export interface IAppModule extends Except<IProviderModule, 'isMarkedAsGlobal'> {
  /** Must be invoked _(only once during the application lifecycle)_ in order to provide the {@link options} to the module. */
  register<AsNaked extends boolean = false>(
    options: AppModuleOptions
  ): AsNaked extends false ? IAppModule : IAppModule & IProviderModuleNaked;

  toNaked(): IAppModule & IProviderModuleNaked;
}

export type AppModuleOptions = Except<LazyInitOptions, 'exports' | 'dynamicExports'>;
