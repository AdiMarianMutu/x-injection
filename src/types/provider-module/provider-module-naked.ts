import type { BindingScope, BindToFluentSyntax, Container, GetOptions, IsBoundOptions } from 'inversify';
import type { Except } from 'type-fest';

import type { InjectionScope } from '../../enums';
import type { ProviderModuleUtils } from '../../utils';
import type {
  ExportsList,
  IProviderModule,
  ModuleIdentifier,
  ProviderModuleOptions,
  ProviderModuleOptionsInternal,
  ProviderModuleOrDefinition,
} from '../provider-module';
import type { DependencyProvider, ProviderToken } from '../provider-token';

/** Can be used to publicly expose internal properties and methods of an {@link IProviderModule} instance. */
export interface IProviderModuleNaked extends IProviderModule {
  /** It'll be `true` when the current module is the global `AppModule`. */
  readonly isAppModule: boolean;

  /** It'll be `true` when the `module` has been instantiated from a `ProviderModuleDefinition` instance. */
  readonly instantiatedFromDefinition: boolean;

  /** The low-level `InversifyJS` {@link https://inversify.io/docs/api/container/ | container} instance. */
  readonly container: Container;

  /** The default injection scope of this module. */
  readonly defaultScope: {
    /** Scope from `xInjection` {@link InjectionScope} enum. */
    native: InjectionScope;

    /** Scope from `InversifyJS` {@link BindingScope} string union. */
    inversify: BindingScope;
  };

  /** Instance of the {@link ProviderModuleUtils}. */
  readonly moduleUtils: ProviderModuleUtils;

  /** The {@link DependencyProvider | providers} resolved by this module. */
  readonly providers: DependencyProvider[];

  /** What is exported into this module. */
  readonly imports: ProviderModuleOrDefinition[];

  /** What is exported from this module. */
  readonly exports: ExportsList;

  /** The registered `callback` which will be invoked when the internal initialization process has been completed. */
  readonly onReady: ProviderModuleOptions['onReady'];

  /** The registered `callback` which will be invoked when the {@link _dispose} method is invoked. */
  readonly onDispose: ProviderModuleOptions['onDispose'];

  readonly registeredSideEffects: RegisteredSideEffects;

  /** It'll _completely_ re-init the `module` with the provided {@link InternalInitOptions | options}. */
  _internalInit(options: InternalInitOptions): IProviderModule;

  /**
   * Can be used to execute the provided {@link cb | callback} whenever a _new_ {@link https://inversify.io/docs/fundamentals/binding/ | binding}
   * is registered for the {@link provider}.
   *
   * @param provider The {@link ProviderToken}.
   * @param cb The `callback` to be invoked.
   */
  _onBind<T>(provider: ProviderToken<T>, cb: () => Promise<void> | void): void;

  /**
   * Can be used to execute the provided {@link cb | callback} whenever the
   * {@link IProviderModule.get | get} method is invoked.
   *
   * @param provider The {@link ProviderToken}.
   * @param once When set to `true` it'll invoke the provided {@link cb | callback} only once.
   * @param cb The `callback` to be invoked.
   */
  _onGet<T>(provider: ProviderToken<T>, once: boolean, cb: () => Promise<void> | void): void;

  /**
   * Can be used to execute the provided {@link cb | callback} whenever an existing {@link https://inversify.io/docs/fundamentals/binding/ | binding}
   * is re-registered for the {@link provider}.
   *
   * @param provider The {@link ProviderToken}.
   * @param cb The `callback` to be invoked.
   */
  _onRebind<T>(provider: ProviderToken<T>, cb: () => Promise<void> | void): void;

  /**
   * Can be used to execute the provided {@link cb | callback} whenever a {@link provider} is `unbound`.
   *
   * **Note:** _All the {@link _onBind}, {@link _onGet}, {@link _onRebind} and {@link _onUnbind} registered callbacks will be removed_
   *
   * @param provider The {@link ProviderToken}.
   * @param cb The `callback` to be invoked.
   */
  _onUnbind<T>(provider: ProviderToken<T>, cb: () => Promise<void> | void): void;

  /**
   * Internal method which can be used to completely overwrite the module {@link container}
   * with the one provided.
   *
   * @param cb Callback which when invoked must return an instance of the {@link Container}.
   */
  _overwriteContainer(cb: () => Container): void;

  //#region InversifyJS Container native methods

  /**
   * Binds a {@link ProviderToken | provider}.
   *
   * See {@link https://inversify.io/docs/api/container/#bind | Container.bind} for more details.
   */
  __bind<T>(provider: ProviderToken<T>): BindToFluentSyntax<T>;

  /**
   * Resolves a dependency by its runtime identifier.
   * The runtime identifier must be associated with only one binding and the binding must be synchronously resolved,
   * otherwise an error is thrown.
   *
   * @param provider The {@link ProviderToken}.
   * @param options The {@link GetOptions}.
   * @returns Either the {@link T | dependency} or `undefined` if {@link GetOptions.optional} is set to `true`.
   *
   * See {@link https://inversify.io/docs/api/container/#get | Container.get} for more details.
   */
  __get<T>(provider: ProviderToken<T>, options?: GetOptions): T;

  /**
   * Resolves a dependency by its runtime identifier.
   * The runtime identifier must be associated with only one binding,
   * otherwise an error is thrown.
   *
   * @param provider The {@link ProviderToken}.
   * @param options The {@link GetOptions}.
   * @returns Either the {@link T | dependency} or `undefined` if {@link GetOptions.optional} is set to `true`.
   *
   * See {@link https://inversify.io/docs/api/container/#getasync | Container.getAsync} for more details.
   */
  __getAsync<T>(provider: ProviderToken<T>, options?: GetOptions): Promise<T>;

  /** See {@link https://inversify.io/docs/api/container/#getall | Container.getAll} for more details. */
  __getAll<T>(provider: ProviderToken<T>, options?: GetOptions): T[];

  /** See {@link https://inversify.io/docs/api/container/#getallasync | Container.getAllAsync} for more details. */
  __getAllAsync<T>(provider: ProviderToken<T>, options?: GetOptions): Promise<T[]>;

  /**
   * Can be used to check if there are registered bindings for the {@link provider | provider}.
   *
   * See {@link https://inversify.io/docs/api/container/#isbound | Container.isBound} for more details.
   */
  __isBound(provider: ProviderToken, options?: IsBoundOptions): boolean;

  /**
   * Can be useed to check if there are registered bindings for the {@link provider | provider} only in the current container.
   *
   * See {@link https://inversify.io/docs/api/container/#iscurrentbound | Container.isCurrentBound} for more details.
   */
  __isCurrentBound(provider: ProviderToken, options?: IsBoundOptions): boolean;

  /**
   * Save the state of the container to be later restored with the restore method.
   *
   * See {@link https://inversify.io/docs/api/container/#snapshot | Container.snapshot} for more details.
   */
  __takeSnapshot(): void;

  /**
   * Restore container state to last snapshot.
   *
   * See {@link https://inversify.io/docs/api/container/#restore | Container.restore} for more details.
   */
  __restoreSnapshot(): void;

  /**
   * Convenience method that unbinds a {@link ProviderToken | provider} and then creates a new binding for it.
   * This is equivalent to calling await `container.unbind` followed by `container.bind`, but in a single method.
   *
   * @param provider The {@link ProviderToken}.
   * @returns A {@link BindToFluentSyntax | binding builder} to continue configuring the new binding.
   *
   * See {@link https://inversify.io/docs/api/container/#rebind | Container.rebind} for more details.
   */
  __rebind<T>(provider: ProviderToken<T>): Promise<BindToFluentSyntax<T>>;

  /**
   * Synchronous version of {@link __rebindProvider}. Unbinds a {@link ProviderToken | provider} synchronously and then creates a new binding for it.
   * Will throw an error if the unbind operation would be asynchronous.
   *
   * @param provider The {@link ProviderToken}.
   * @returns A {@link BindToFluentSyntax | binding builder} to continue configuring the new binding.
   *
   * See {@link https://inversify.io/docs/api/container/#rebindsync | Container.rebindSync} for more details.
   */
  __rebindSync<T>(provider: ProviderToken<T>): BindToFluentSyntax<T>;

  /**
   * Removes **all** the associated bindings with the {@link provider} from the container.
   *
   * This will result in the {@link https://inversify.io/docs/fundamentals/lifecycle/deactivation/ | deactivation process}.
   *
   * See {@link https://inversify.io/docs/api/container/#unbind | Container.unbind} for more details.
   */
  __unbind(provider: ProviderToken): Promise<void>;

  /**
   * Removes **all** the associated bindings with the {@link provider} from the container synchronously.
   * This method works like {@link __unbind} but does not return a Promise.
   * If the unbinding operation would be asynchronous (e.g. due to deactivation handlers),
   * it will throw an error. Use this method when you know the operation won't involve async deactivations.
   *
   * This will result in the {@link https://inversify.io/docs/fundamentals/lifecycle/deactivation/ | deactivation process}.
   *
   * See {@link https://inversify.io/docs/api/container/#unbindsync | Container.unbindSync} for more details.
   */
  __unbindSync(provider: ProviderToken): void;

  /**
   * Remove all bindings bound in this container.
   *
   * This will result in the {@link https://inversify.io/docs/fundamentals/lifecycle/deactivation/ | deactivation process}.
   *
   * See {@link https://inversify.io/docs/api/container/#unbindall | Container.unbindAll} for more details.
   */
  __unbindAll(): Promise<void>;

  //#endregion
}

export type InternalInitOptions = Except<
  ProviderModuleOptions & ProviderModuleOptionsInternal,
  'identifier' | 'isAppModule'
>;

export type RegisteredSideEffects = Map<
  ProviderToken,
  {
    onBindEffects: OnBindEffects[];
    onGetEffects: OnGetEffects[];
    onRebindEffects: OnRebindEffects[];
    onUnbindEffects: OnUnbindEffects[];
  }
>;

export type OnBindEffects = () => Promise<void> | void;
export type OnGetEffects = { once: boolean; invoked: boolean; cb: () => Promise<void> | void };
export type OnRebindEffects = () => Promise<void> | void;
export type OnUnbindEffects = { registerModuleId?: ModuleIdentifier; cb: () => Promise<void> | void };
