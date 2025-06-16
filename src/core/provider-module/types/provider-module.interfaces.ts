import type {
  DependencyProvider,
  ModuleDefinition,
  ModuleIdentifier,
  ProviderIdentifier,
  ProviderToken,
} from '../../../types';
import type { IDynamicModuleDefinition } from '../../dynamic-module-definition';
import type { IMiddlewaresManager } from '../../middlewares-manager';
import type { ModuleBlueprintOptions, ProviderModuleBlueprint } from '../../provider-module-blueprint';
import type { ProviderModuleOptions } from './module-options';

export declare abstract class IProviderModule {
  /** The `identifier` of this {@link IProviderModule | Module}. */
  readonly id: ModuleIdentifier;

  /**
   * The {@link ModuleDefinition} of this {@link IProviderModule | Module}.
   *
   * **Note:** _You shouldn't manually modify the {@link ModuleDefinition}!_
   * _Interact via the {@link update} methods instead._
   */
  readonly definition: ModuleDefinition<true>;

  /** The {@link IDynamicModuleDefinition} of this {@link IProviderModule | Module}. */
  readonly update: IDynamicModuleDefinition;

  /** The {@link IMiddlewaresManager} of this {@link IProviderModule | Module}. */
  readonly middlewares: IMiddlewaresManager;

  /** It'll be `true` after the {@link dispose} method has been invoked. */
  readonly isDisposed: boolean;

  /**
   * Instantiates a new `instance` of the {@link IProviderModule} class.
   *
   * **Note:** _Check also the {@link blueprint} method._
   *
   * @param options The {@link ProviderModuleOptions}.
   */
  static create(options: ProviderModuleOptions): IProviderModule;

  /**
   * Can be used when you _don't_ want to initialize a `ProviderModule` eagerly as each `ProviderModule` has its own container
   * initialized as soon as you do `ProviderModule.create({...})`.
   *
   * The {@link ProviderModuleBlueprint} allows you to just _define_ a `blueprint` of a `ProviderModule`,
   * you can then decide to either _instantiate_ it or _import_ as it is into different modules _(or blueprints)_.
   *
   * **Note:** _As soon as you import a `blueprint` into a `module`, it'll be automatically transformed into a {@link IProviderModule} instance!_
   * _Also keep in mind that editing the `blueprint` after it has been consumed by a `module` will not propagate the changes to the consumer `module`!_
   *
   * **[WARNING]**: When you import the same `blueprint` into different modules, each `module` will create a new `module` instance
   * based on that specific `blueprint`, this may not seem obvious at first, but it happens because a `blueprint` is just that, a template defining the options
   * which will be used to build a `module`.
   * This means that if a `blueprint` exports a `singleton` provider, when imported into two separate modules, each `module` will have _its own_ instance of that
   * specific `singleton` provider!
   * You should also keep in mind that once a `blueprint` has been encapsulated into a `module`, it can't be removed anymore as you can do with the modules!
   *
   * Why should you use a {@link ProviderModuleBlueprint}?
   *
   * - To _define module configurations upfront_ without incurring the cost of immediate initialization.
   * - To reuse module _definitions across_ different parts of your application while maintaining isolated instances.
   * - To _compose modules flexibly_, allowing you to adjust module dependencies dynamically before instantiation.
   *
   * You can always edit a property of the `blueprint` after creating it by doing:
   *
   * ```ts
   * const GarageModuleBlueprint = ProviderModule.blueprint({ id: 'GarageModuleBlueprint' });
   *
   * // Later in your code
   *
   * GarageModuleBlueprint.imports = [...GarageModuleBlueprint.imports, PorscheModule, FerrariModuleBlueprint];
   *
   * // ...
   *
   * const GarageModule = ProviderModule.create(GarageModuleBlueprint);
   *
   * // or
   *
   * ExistingModule.update.addImport(GarageModuleBlueprint);
   * ```
   *
   * @param moduleOptions The {@link ProviderModuleOptions}.
   * @param blueprintOptions Options specific to the {@link ProviderModuleBlueprint | Blueprint} instance, see {@link ModuleBlueprintOptions}.
   */
  static blueprint(
    moduleOptions: ProviderModuleOptions,
    blueprintOptions?: ModuleBlueprintOptions
  ): ProviderModuleBlueprint;

  /**
   * Can be used to check if this {@link IProviderModule | Module} has a specific `module` imported into it.
   *
   * @param idOrModule Either the {@link ModuleIdentifier} or the {@link IProviderModule} itself.
   */
  isImportingModule(idOrModule: ModuleIdentifier | IProviderModule): boolean;

  /**
   * Can be used to check if this {@link IProviderModule | Module} has a specific `provider` bound to _its_ container.
   *
   * @param provider The {@link DependencyProvider | Provider} to lookup for.
   */
  hasProvider<T>(provider: DependencyProvider<T>): boolean;

  /**
   * Can be used to retrieve a {@link provider} from the module container.
   *
   * @param provider The {@link ProviderToken}.
   * @param isOptional When set to `false` _(default)_ an exception will be thrown when the supplied {@link ProviderToken} isn't bound.
   * @param asList Set to `true` if you need to retrieve _all_ the bound identifiers of the supplied {@link ProviderToken}. _(defaults to `false`)_
   */
  get<T, IsOptional extends boolean | undefined = undefined, AsList extends boolean | undefined = undefined>(
    provider: ProviderToken<T>,
    isOptional?: IsOptional,
    asList?: AsList
  ): ProviderModuleGetReturn<T, IsOptional, AsList>;

  /**
   * Can be used to retrieve many providers from the module container at once.
   *
   * @param deps Either one or more {@link ProviderToken}.
   * @returns Tuple containing the {@link D | providers}.
   *
   * ```ts
   * // When ProviderTokens are supplied, TS auto-inference works as expected.
   * // `car` will infer the `Car` type, `engine` the `Engine` type and `dashboard` the `Dashboard` type.
   * const [car, engine, dashboard, wheels] = Module.getMany(
   *   Car,
   *   Engine,
   *   { provider: Dashboard, isOptional: true },
   *   { provider: Wheel, asList: true },
   * );
   *
   * // When auto-inference is not possible, you can manually cast the types.
   * const [configService, userService] = Module.getMany('CONFIG_SERVICE', UserService) as [ConfigService, UserService];
   * // Now the `configService` is of type `ConfigService` and the `userService` is of type `UserService`.
   * ```
   */
  getMany<D extends (ProviderModuleGetManyParam<any> | ProviderToken | ProviderIdentifier)[]>(
    ...deps: D
  ): ProviderModuleGetManyReturn<D>;

  /**
   * Can be used to check if _this_ {@link IProviderModule | Module} is `exporting` a specific {@link IProviderModule | Module}.
   *
   * @param idOrModule Either the {@link ModuleIdentifier} or the {@link IProviderModule} itself.
   */
  isExportingModule(idOrModule: ModuleIdentifier | IProviderModule): boolean;

  /**
   * Can be used to check if _this_ {@link IProviderModule | Module} is `exporting` a specific {@link DependencyProvider | Provider}.
   *
   * @param tokenOrIdentifier Either the {@link ProviderToken} or the {@link ProviderIdentifier} itself.
   */
  isExportingProvider(tokenOrIdentifier: ProviderToken | ProviderIdentifier): boolean;

  /**
   * Can be used to _completely_ reset a module.
   *
   * It means that all bound providers will be removed from the `container` and
   * all definitions cleared, leaving it as a pristine module ready to be
   * updated with new definitions.
   *
   * **Note:** _This is not the same as the {@link dispose} method!_
   */
  reset(): Promise<void>;

  /**
   * It first invokes the {@link reset} method and then permanentely destroys the module's `container`.
   *
   * **Note:** _If other modules have imported `this` module, they'll not be able anymore to_
   * _resolve dependencies from it which will cause errors to be thrown!_
   * _Make sure to use {@link dispose} carefully as it is an irreversible action._
   */
  dispose(): Promise<void>;

  /** Returns the {@link IProviderModule.id}. */
  toString(): string;
}

export type ProviderModuleGetReturn<
  T,
  IsOptional extends boolean | undefined = undefined,
  AsList extends boolean | undefined = undefined,
> = AsList extends true
  ? IsOptional extends true
    ? (T | undefined)[]
    : T[]
  : IsOptional extends true
    ? T | undefined
    : T;

export type ProviderModuleGetManyReturn<
  Tokens extends (ProviderModuleGetManyParam<any> | ProviderToken | ProviderIdentifier)[],
> = {
  [K in keyof Tokens]: Tokens[K] extends ProviderModuleGetManyParam<infer U>
    ? ProviderModuleGetReturn<U, Tokens[K]['isOptional'], Tokens[K]['asList']>
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

  /** Set to `true` if you need to retrieve _all_ the bound identifiers of the supplied {@link ProviderToken}. _(defaults to `false`)_ */
  asList?: boolean;
};
