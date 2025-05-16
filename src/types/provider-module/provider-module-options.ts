import type { Container } from 'inversify';

import type { GlobalAppModule } from '../../core';
import type { InjectionScope } from '../../enums';
import type { DependencyProvider, ProviderToken } from '../provider-token';
import type { IProviderModule } from './provider-module';

export interface ProviderModuleOptions {
  /** The module unique ID. */
  identifier: symbol;

  /** The list of imported {@link IProviderModule | modules} that export the {@link Provider | providers} which are required in this module. */
  imports?: (IProviderModule | (() => IProviderModule))[];

  /** The {@link DependencyProvider | providers} that will be instantiated by the container and that may be shared at least across this module. */
  providers?: DependencyProvider[];

  /**
   * The subset of {@link ProviderToken | providers} or {@link IProviderModule | modules} that
   * are provided by this module and should be available in other modules which import this module.
   *
   * _Check also the {@link dynamicExports} property._
   */
  exports?: StaticExports;

  /**
   * The default {@link InjectionScope} to be used when a {@link ProviderToken} does not have a defined `scope`.
   *
   * Defaults to {@link InjectionScope.Singleton}.
   */
  defaultScope?: InjectionScope;

  /**
   * This option is only a _marker_, per se it doesn't do anything
   * apart from marking this module as `global`.
   * When a module is marked as `global`, it means that it is expected to be _imported_ into the `AppModule`.
   *
   * Expect an exception to be thrown:
   * - If a `module` marked as global is **not** imported into the `AppModule`.
   * - If a `module` **not** marked as global _is_ imported into the `AppModule`
   *
   * Defaults to `false`.
   */
  markAsGlobal?: boolean;

  /**
   * When provided, can be used to control which providers from the {@link ProviderModuleOptions.exports | exports}
   * array should actually be exported into the importing module.
   *
   * **Note:** _Static {@link ProviderModuleOptions.exports | exports} should always be preferred as their static nature implies predictibility._
   * _This is for advanced use cases only, and most probably you may never need to use a dynamic export!_
   *
   * @example
   * ```ts
   * {
   *   exports: [ConfigModule, UserModule, PaymentService, ReviewService],
   *   dynamicExports: (importerModule, moduleExports) => {
   *     const shouldExportOnlyTheServices = true;
   *
   *     if (shouldExportOnlyTheServices === false) return moduleExports;
   *
   *     return moduleExports.flatMap((ex) => {
   *       // With `flatMap` we can map and filter out elements
   *       // from the sequence at the same time
   *       // by returning an empty array.
   *       return ex instanceof ProviderModule ? [] : ex;
   *     });
   *   }
   * }
   *
   * // Or
   *
   * {
   *   exports: [ConfigModule, UserModule, PaymentService, ReviewService],
   *   dynamicExports: (importerModule, moduleExports) => {
   *     // We export all the providers only when the importer module is not the `BULLIED_MODULE`.
   *     if (importerModule.toNaked().name !== 'BULLIED_MODULE') return moduleExports;
   *
   *     return [ConfigModule];
   *   }
   * }
   *
   * ```
   */
  dynamicExports?: DynamicExports;

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
   * Callback which will be invoked whenever the internal module dispose method is invoked.
   *
   * **The method will be invoked right _before_ the clean-up process.**
   *
   * @param module The instance of the {@link IProviderModule | module}.
   */
  onDispose?: (module: IProviderModule) => Promise<void>;
}

export interface ProviderModuleOptionsInternal {
  isAppModule?: boolean;
  isDisposed?: boolean;

  /** Can be used to manually provide the {@link IAppModule} instance. */
  appModule?: () => GlobalAppModule;

  /** Can be used to manually provide a {@link Container} instance. */
  container?: () => Container;

  /** Can be used to override all the _imported_ providers _before_ the binding process. */
  importedProvidersMap?: (
    /** The current imported {@link DependencyProvider | provider} altered to use the module from where was imported for resolution. */
    factorizedProvider: DependencyProvider<any>,
    /** The current imported {@link DependencyProvider | provider}. */
    provider: DependencyProvider<any>,
    /** The {@link IProviderModule | module} from where the {@link DependencyProvider | provider} originated. */
    module: IProviderModule
  ) => DependencyProvider<any>;
}

export type StaticExports = (ProviderToken | IProviderModule)[];
export type DynamicExports = (
  /** The {@link IProviderModule} which is importing this module. */
  importerModule: IProviderModule,

  /** The {@link ProviderModuleOptions.exports | exports} array of this module. */
  moduleExports: StaticExports
) => StaticExports;
