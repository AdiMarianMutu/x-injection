import type { Container } from 'inversify';
import type { RequireAtLeastOne } from 'type-fest';

import type { GlobalAppModule } from '../../core';
import type { InjectionScope } from '../../enums';
import type { DependencyProvider, ProviderToken } from '../provider-token';
import type { IProviderModule, ProviderModuleOrDefinition } from './provider-module';

export interface ProviderModuleOptions {
  /** The module unique `ID`. */
  identifier: symbol | string;

  /** Import additional {@link IProviderModule | modules} into _this_ module. */
  imports?: ProviderModuleOrDefinition[];

  /** The {@link DependencyProvider | providers} that will be instantiated by the container and that may be shared at least across _this_ module. */
  providers?: DependencyProvider[];

  /**
   * The subset of {@link ProviderToken | providers} or {@link IProviderModule | modules} that
   * are provided by _this_ module and should be available in other modules which import _this_ module.
   *
   * **Note:** _Supports lazy exports, see {@link LazyExport}._
   */
  exports?: ExportsList;

  /**
   * The default {@link InjectionScope} to be used when a {@link ProviderToken} does not have a defined `scope`.
   *
   * Defaults to {@link InjectionScope.Singleton}.
   */
  defaultScope?: InjectionScope;

  /**
   * When a module is marked as `global`, it means that it is expected to be _imported_ into the `AppModule`.
   *
   * **Note:** _Importing a `global` module into a `scoped` module will automatically import it into the `AppModule` rather than the scoped module itself!_
   *
   * Expect an exception to be thrown:
   * - If a `module` marked as global is **not** imported into the `AppModule`.
   * - If a `module` **not** marked as global _is_ imported into the `AppModule`
   *
   * Defaults to `false`.
   */
  isGlobal?: boolean;

  /**
   * Callback which will be invoked once the module container has been initialized
   * and the providers resolved.
   *
   * **This happens only once, when the {@link IProviderModule | ProviderModule} has been bootstrapped!**
   *
   * @param module The instance of the {@link IProviderModule | module}.
   */
  onReady?: (module: IProviderModule) => Promise<void>;

  /**
   * Callback which will be invoked when the module dispose method is invoked.
   *
   * @returns See {@link OnDisposeOptions}.
   */
  onDispose?: () => OnDisposeOptions;
}

export interface ProviderModuleOptionsInternal {
  isAppModule?: boolean;
  instantiatedFromDefinition?: boolean;
  isDisposed?: boolean;

  /** Can be used to manually provide the {@link IAppModule} instance. */
  appModule?: () => GlobalAppModule;

  /** Can be used to manually provide a {@link Container} instance. */
  container?: () => Container;
}

export type ExportsList = (StaticExport | LazyExport)[];
export type StaticExport = ProviderToken | ProviderModuleOrDefinition;
export type LazyExport = (
  /** The {@link IProviderModule | module} which is importing _this_ module. */
  importerModule: IProviderModule
) => StaticExport | void;

export type OnDisposeOptions = RequireAtLeastOne<{
  /**
   * It'll be invoked _before_ the dispose process starts.
   *
   * @param module The {@link IProviderModule | module} instance.
   */
  before: (module: IProviderModule) => void | Promise<void>;

  /**
   * It'll be invoked _after_ the dispose process ended.
   *
   * **Note:** _At this point the internal container has been destroyed and it'll be `null` when trying to access it._
   *
   * @param module The {@link IProviderModule | module} instance.
   */
  after: (module: IProviderModule) => void | Promise<void>;
}>;
