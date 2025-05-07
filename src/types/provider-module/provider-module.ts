import type { BindingActivation, BindingDeactivation } from 'inversify';

import type { ProviderIdentifier, ProviderToken } from '../provider-token';
import type { IProviderModuleNaked } from './provider-module-naked';

export interface IProviderModule {
  /** The module unique ID. */
  readonly identifier: symbol;

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
   *   { providerOrIdentifier: Dashboard, isOptional: true }
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
   * Adds an activation handler for the {@link provider}.
   *
   * See {@link https://inversify.io/docs/api/container/#onactivation} for more details.
   */
  onActivationEvent<T>(provider: ProviderToken<T>, cb: BindingActivation<T>): void;

  /**
   * Adds a deactivation handler for the {@link provider}.
   *
   * See {@link https://inversify.io/docs/api/container/#ondeactivation} for more details.
   */
  onDeactivationEvent<T>(provider: ProviderToken<T>, cb: BindingDeactivation<T>): void;

  /**
   * Casts the current module type to the {@link IProviderModuleNaked} type.
   *
   * **Internally used and for testing purposes!**
   */
  toNaked(): IProviderModuleNaked;

  /** Returns the {@link IProviderModule.identifier} `symbol` description. */
  toString(): string;
}

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
