import type { ProviderIdentifier, ProviderToken } from '../provider-token';
import type { IProviderModuleNaked } from './provider-module-naked';
import type { ProviderModuleOptions } from './provider-module-options';

export interface IProviderModule {
  /** The module unique ID. */
  readonly identifier: ModuleIdentifier;

  /** See {@link ProviderModuleOptions.markAsGlobal}. */
  readonly isMarkedAsGlobal: ProviderModuleOptions['markAsGlobal'];

  readonly isDisposed: boolean;

  /**
   * Can be used to retrieve a resolved `dependency` from the module container.
   *
   * @param provider The {@link ProviderToken}.
   * @param isOptional When set to `false` _(default)_ an exception will be thrown when the {@link provider} isn't bound.
   * @returns Either the {@link T | dependency} or `undefined` if {@link isOptional} is set to `true`.
   */
  get<T>(provider: ProviderToken<T>, isOptional?: boolean): T;

  /**
   * Can be used to retrieve many resolved `dependencies` from the module container at once.
   *
   * @param deps Either one or more {@link ProviderToken}.
   * @returns Tuple containing the {@link D | dependencies}.
   *
   * @example
   * ```ts
   * // When ProviderTokens are supplied, TS auto-inference works as expected.
   * // `car` will infer the `Car` type, `engine` the `Engine` type and `dashboard` the `Dashboard` type.
   * const [car, engine, dashboard] = AppModule.getMany(
   *   Car,
   *   Engine,
   *   { provider: Dashboard, isOptional: true }
   * );
   *
   * // When auto-inference is not possible, you can manually cast the types.
   * const [configService, userService] = AppModule.getMany<[typeof ConfigService, typeof UserService]>('CONFIG_SERVICE', UserService);
   * // Now the `configService` is of type `ConfigService` and the `userService` is of type `UserService`.
   * ```
   */
  getMany<D extends (ProviderModuleGetManyParam<any> | ProviderToken)[]>(
    ...deps: D | unknown[]
  ): ProviderModuleGetManySignature<D>;

  /**
   * Casts the current module type to the {@link IProviderModuleNaked} type.
   *
   * **Internally used and for testing purposes!**
   */
  toNaked(): IProviderModuleNaked;

  /**
   * Removes all the bindings from the {@link IProviderModuleNaked.container | container}.
   *
   * **Note:** The module can be fully re-initialized by invoking the {@link _lazyInit} method.
   */
  dispose(): Promise<void>;

  /** Returns the {@link IProviderModule.identifier}. */
  toString(): string;
}

export type ModuleIdentifier = symbol | string;

export type ProviderModuleGetManySignature<Tokens extends (ProviderModuleGetManyParam<any> | ProviderToken)[]> = {
  [K in keyof Tokens]: Tokens[K] extends ProviderModuleGetManyParam<infer U>
    ? U
    : Tokens[K] extends ProviderToken<infer T>
      ? T
      : Tokens[K] extends ProviderIdentifier<infer I>
        ? I
        : never;
};

export type ProviderModuleGetManyParam<T> = {
  /** The {@link ProviderToken}. */
  provider: ProviderToken<T>;

  /** When set to `false` _(default)_ an exception will be thrown when the {@link ProviderModuleGetManyParam.provider | provider} isn't bound. */
  isOptional?: boolean;
};
