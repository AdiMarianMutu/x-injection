import type { RequireAtLeastOne } from 'type-fest';

import type { InjectionScope } from '../../../enums';
import type { ExportsDefinition, ImportsDefinition, ModuleIdentifier, ProvidersDefinition } from '../../../types';
import type { IProviderModule } from './provider-module.interfaces';

export interface ProviderModuleOptions {
  /**
   * The module `ID`.
   *
   * **Note:** _It doesn't have to be unique, however, the `AppModule` id is a reserved id and it'll throw an error if used._
   */
  readonly id: ModuleIdentifier;

  /** Import additional `modules` or `blueprints` into _this_ module. */
  readonly imports?: ImportsDefinition;

  /** The `providers` that will be instantiated by the container and that may be shared at least across _this_ module. */
  readonly providers?: ProvidersDefinition;

  /**
   * The subset of `providers`, `modules` or `blueprints` that
   * are provided by _this_ module and should be available in other modules which import _this_ module.
   */
  readonly exports?: ExportsDefinition;

  /**
   * The default {@link InjectionScope} to be used when a {@link ProvidersDefinition | Provider} does not have a defined `scope`.
   *
   * Defaults to {@link InjectionScope.Singleton}.
   */
  readonly defaultScope?: InjectionScope;

  /**
   * When a module is set to be `global`, it'll be automatically imported into the `AppModule`
   * during its initialization.
   *
   * **Note:** _Importing a `global` module into another module does nothing._
   *
   * Defaults to `false`.
   */
  readonly isGlobal?: boolean;

  /**
   * Callback which will be invoked once the module container has been initialized
   * and the providers resolved.
   *
   * @param module The instance of the {@link IProviderModule | module}.
   */
  readonly onReady?: (module: IProviderModule) => void | Promise<void>;

  /**
   * The provided callbacks will be invoked when the `reset` method is invoked.
   *
   * @returns See {@link OnCleanupOptions}.
   */
  readonly onReset?: () => OnCleanupOptions;

  /**
   * The provided callbacks will be invoked when the `dispose` method is invoked.
   *
   * @returns See {@link OnCleanupOptions}.
   */
  readonly onDispose?: () => OnCleanupOptions;
}

export type OnCleanupOptions = RequireAtLeastOne<{
  /**
   * It'll be invoked _before_ the process starts.
   *
   * @param module The {@link IProviderModule | module} instance.
   */
  before: (module: IProviderModule) => void | Promise<void>;

  /** It'll be invoked _after_ the process ended. */
  after: () => void | Promise<void>;
}>;
