import type { BindingActivation, BindingDeactivation } from 'inversify';

import type { DependencyProvider, ProviderIdentifier, ProviderToken } from '../provider-token';
import type { IProviderModuleNaked } from './provider-module-naked';
import { ProviderModuleOptionsInternal } from './provider-module-options';

export interface IProviderModule {
  /** The module unique ID. */
  readonly identifier: symbol;

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

  /**
   * Can be used to create a new instance of the current {@link IProviderModule | module}.
   *
   * **Note:** _All the providers will be registered again within the new module!_
   * _And also the new module will still refrain values by reference to its parent module because of_
   * _JS limitation in deeply/truly cloning an instance._
   *
   * @param options See {@link CloneParams}.
   */
  clone(options?: CloneParams): IProviderModule;

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

export interface CloneParams {
  /** Can be used to override all the providers _before_ the binding process. */
  providersMap?: (
    /** The current {@link DependencyProvider | provider}. */
    provider: DependencyProvider<any>,
    /** The {@link IProviderModule | module} from where the {@link DependencyProvider | provider} originated. */
    module: IProviderModule,
    /** Flag indicating if the {@link provider} has been imported from the {@link module}. */
    isImported: boolean
  ) => DependencyProvider<any>;

  /** Can be used to override all the _imported_ providers _before_ the binding process. */
  importedProvidersMap?: ProviderModuleOptionsInternal['importedProvidersMap'];
}
