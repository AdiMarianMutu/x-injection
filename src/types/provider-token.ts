import type { BindingConstraints } from 'inversify';
import type { Class } from 'type-fest';

import type { IProviderModule } from '../core';
import type { InjectionScope } from '../enums';

export type ProviderToken<T = any> = ProviderIdentifier<T> | DependencyProvider<T>;

export type DependencyProvider<T = any> =
  | Class<T>
  | Function
  | ProviderClassToken<T>
  | ProviderValueToken<T>
  | ProviderFactoryToken<T>;

export type ProviderClassToken<T> = (ProviderOptions<T> & ProviderScopeOption) & {
  /** The `class` to be injected. */
  useClass: Class<T>;
};

export type ProviderValueToken<T> = ProviderOptions<T> & {
  /** The _(constant)_ `value` to be injected. */
  useValue: T;
};

export type ProviderFactoryToken<T> = (ProviderOptions<T> & ProviderScopeOption) & {
  /**
   * Factory `function` that returns an instance of the provider to be injected.
   *
   * @example
   * ```ts
   * const connectionProvider = {
   *   provide: 'CONNECTION',
   *   useFactory: (optionsService: OptionsService, secondService: SecondService) => {
   *     const options = optionsService.get();
   *
   *     return new DatabaseConnection(options);
   *   },
   *   // `inject` is optional.
   *   inject: [OptionsService, SecondService]
   * };
   * ```
   */
  useFactory: (...providers: any[]) => T;

  /**
   * Optional list of providers to be injected into the context of the Factory `function`.
   *
   * **Note:** _The current module container context is available too._
   *
   * ```ts
   * ProviderModule.create({
   *   id: 'FactoryProviderModule',
   *   providers: [
   *     DatabaseService,
   *     {
   *       provide: 'DATABASE_SECRET',
   *       useFactory: (dbService: DatabaseService) => {
   *         // Here you have access to the already resolved `DatabaseService` of the `FactoryProviderModule`.
   *         return dbService.getSecret();
   *       },
   *       inject: [DatabaseService]
   *     }
   *   ]
   * });
   * ```
   */
  inject?: ProviderIdentifier[];
};

export type ProviderIdentifier<T = any> = Class<T> | Function | symbol | string;

export interface ProviderOptions<T> {
  /** The injection `token`.  */
  provide: ProviderIdentifier<T>;

  /** Can be used to bind a `callback` to a specific internal `event`. */
  event?: {
    /**
     * It'll be invoked when the {@link IProviderModule | Module} `get` method is used to retrieve this {@link ProviderToken}.
     *
     * @param module The {@link IProviderModule | Module} from where is being retrieved.
     */
    onGet?: (module: IProviderModule) => void;

    /**
     * It'll be invoked when the {@link IProviderModule | Module} is removing this {@link ProviderToken} from its container.
     *
     * @param module The {@link IProviderModule | Module} from where is being removed.
     */
    onRemove?: (module: IProviderModule) => void;
  };

  /**
   * Specifies whether the binding is used to provide a resolved value for the given {@link ProviderToken | provider}.
   *
   * See {@link https://inversify.io/docs/api/binding-syntax/#bindwhenfluentsyntax} for more details.
   */
  when?: (metadata: BindingConstraints) => boolean;
}

export interface ProviderScopeOption {
  /**
   * The scope determines the caching strategy used to decide whether the service should be resolved or a cached value should be provided.
   *
   * If not provided, it'll default to the `ProviderModule` default scope.
   *
   * See {@link https://inversify.io/docs/fundamentals/binding/#scope} for more details..
   */
  scope?: InjectionScope;
}
