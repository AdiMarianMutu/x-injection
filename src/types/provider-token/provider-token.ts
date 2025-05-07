import type { BindingConstraints } from 'inversify';
import type { Class } from 'type-fest';

import type { InjectionScope } from '../../enums';
import type { OnEvent } from './on-event';

export type ProviderToken<T = any> =
  | ProviderIdentifier<T>
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
   * See {@link https://inversify.io/docs/api/binding-syntax/#toresolvedvalue} for more details.
   */
  // inject?: ProviderOrIdentifier[];
  inject?: ProviderToken[];
};

export type ProviderIdentifier<T = any> = Class<T> | Function | symbol | string;

export interface ProviderOptions<T> {
  /** The injection `token`.  */
  provide: ProviderIdentifier<T>;

  /**
   * Can be used to set a binding handler.
   *
   * See {@link https://inversify.io/docs/fundamentals/lifecycle/activation/ | Activation}
   * and {@link https://inversify.io/docs/fundamentals/lifecycle/deactivation/ | Deactivation} lifecycle.
   */
  onEvent?: OnEvent<T>;

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
