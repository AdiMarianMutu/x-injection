import type { Except } from 'type-fest';

import type { InternalInitOptions, IProviderModule, IProviderModuleNaked } from './provider-module';

export interface IAppModule extends Except<IProviderModule, 'isGlobal'> {
  readonly _strict: AppModuleOptions['_strict'];

  /** Must be invoked _(only once during the application lifecycle)_ in order to provide the {@link options} to the module. */
  register<AsNaked extends boolean = false>(
    options: AppModuleOptions
  ): AsNaked extends false ? IAppModule : IAppModule & IProviderModuleNaked;

  toNaked(): IAppModule & IProviderModuleNaked;
}

export interface AppModuleOptions
  extends Except<InternalInitOptions, 'appModule' | 'isGlobal' | 'exports' | 'isDisposed'> {
  /**
   * When set to `true` it'll enforce an opinionated set of rules
   * which _can help_ in avoiding common pitfalls which may otherwise produce
   * undesired side-effects or edge-case bugs.
   *
   * **Note:** _Do not open an `issue` if a bug or edge-case is caused by having the `strict` property disabled!_
   *
   * - `markAsGlobal`: Will not be enforced anymore.
   *
   * Defaults to `true`.
   */
  _strict?: boolean;
}
