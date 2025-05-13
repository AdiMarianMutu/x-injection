import {
  Container,
  type BindingActivation,
  type BindingDeactivation,
  type BindToFluentSyntax,
  type GetOptions,
  type IsBoundOptions,
} from 'inversify';

import { InjectionScope } from '../enums';
import {
  InjectionDynamicExportsOutOfRange,
  InjectionProviderModuleDisposedError,
  InjectionProviderModuleError,
  InjectionProviderModuleMissingIdentifierError,
} from '../errors';
import { injectionScopeToBindingScope, isPlainObject, ProviderModuleHelpers, ProviderTokenHelpers } from '../helpers';
import type {
  CloneParams,
  DependencyProvider,
  IProviderModule,
  IProviderModuleNaked,
  LazyInitOptions,
  ProviderModuleGetManyParam,
  ProviderModuleGetManySignature,
  ProviderModuleOptions,
  ProviderModuleOptionsInternal,
  ProviderToken,
  RegisteredBindingSideEffects,
  StaticExports,
} from '../types';
import { ProviderModuleUtils } from '../utils';
import { GlobalContainer } from './global-container';

/**
 * Modules are highly recommended as an effective way to organize your components.
 * For most applications, you'll likely have multiple modules, each encapsulating a closely related set of capabilities.
 *
 * _See {@link ProviderModuleOptions | ProviderModuleOptions}_.
 *
 * @example
 * ```ts
 * const EngineModule = new ProviderModule({
 *   identifier: Symbol('EngineModule'),
 *   providers: [EngineService],
 *   exports: [EngineService]
 * });
 *
 * const DashboardModule = new ProviderModule({
 *   identifier: Symbol('DashboardModule'),
 *   providers: [DashboardService],
 *   exports: [DashboardService]
 * });
 *
 * const CarModule = new ProviderModule({
 *   identifier: Symbol('CarModule'),
 *   imports: [EngineModule, DashboardModule],
 *   providers: [CarService],
 *   exports: [CarService]
 * });
 *
 * // Run-time class replacement:
 * const RedCarModule = new ProviderModule({
 *   identifier: Symbol('RedCarModule'),
 *   imports: [CarModule],
 *   providers: [
 *     {
 *       provide: CarService,
 *       useClass: RedCarService,
 *     }
 *   ],
 * });
 *
 * // Run-time factory example:
 * const BlackCarModule = new ProviderModule({
 *   identifier: Symbol('BlackCarModule'),
 *   imports: [CarModule],
 *   providers: [
 *     {
 *       provide: CarService,
 *       useFactory: (carService: CarService) => {
 *         carService.setColor('black');
 *
 *         return carService;
 *       },
 *       inject: [CarService]
 *     }
 *   ],
 * });
 * ```
 */
export class ProviderModule implements IProviderModule {
  readonly identifier: symbol;
  readonly isMarkedAsGlobal: boolean = false;
  readonly isDisposed: boolean = false;

  protected readonly isAppModule: boolean;
  protected readonly container!: Container;
  protected readonly defaultScope!: IProviderModuleNaked['defaultScope'];
  protected readonly dynamicExports: IProviderModuleNaked['dynamicExports'];
  protected readonly onReady: IProviderModuleNaked['onReady'];
  protected readonly onDispose: IProviderModuleNaked['onDispose'];
  protected readonly importedProvidersMap: IProviderModuleNaked['importedProvidersMap'];
  protected readonly moduleUtils!: IProviderModuleNaked['moduleUtils'];
  protected readonly imports!: IProviderModuleNaked['imports'];
  protected readonly providers!: IProviderModuleNaked['providers'];
  protected readonly importedProviders!: IProviderModuleNaked['importedProviders'];
  protected readonly exports!: IProviderModuleNaked['exports'];

  private readonly registeredBindingSideEffects!: RegisteredBindingSideEffects;

  constructor({
    identifier,
    imports,
    providers,
    exports,
    defaultScope,
    markAsGlobal,
    dynamicExports,
    onReady,
    onDispose,
    ..._internalParams
  }: ProviderModuleOptions) {
    const internalParams = _internalParams as ProviderModuleOptionsInternal;

    // The module id once set should never be changed!
    this.identifier = this.setIdentifier(identifier);
    this.isDisposed = internalParams.isDisposed ?? false;
    // Same goes for the `isAppModule`.
    this.isAppModule = internalParams.isAppModule ?? false;

    // If this module is the `AppModule`,
    // the initialization will be done when the `IProviderModuleNaked._lazyInit` method is invoked.
    if (this.isAppModule) return;

    this._lazyInit({
      markAsGlobal,
      imports,
      providers,
      exports,
      defaultScope,
      dynamicExports,
      onReady,
      onDispose,
      ..._internalParams,
    });
  }

  get<T>(provider: ProviderToken<T>, isOptional?: boolean): T {
    return this.__get(provider, { optional: isOptional ?? false });
  }

  getMany<D extends (ProviderModuleGetManyParam<any> | ProviderToken)[]>(
    ...deps: D | unknown[]
  ): ProviderModuleGetManySignature<D> {
    return (deps as D).map((dep) => {
      const withOptions = isPlainObject(dep) && 'provider' in dep;

      return this.get(withOptions ? dep.provider : dep, withOptions ? dep.isOptional : false);
    }) as any;
  }

  onActivationEvent<T>(provider: ProviderToken<T>, cb: BindingActivation<T>): void {
    this.shouldThrowIfDisposed();

    this.container.onActivation(ProviderTokenHelpers.toServiceIdentifier(provider), cb);
  }

  onDeactivationEvent<T>(provider: ProviderToken<T>, cb: BindingDeactivation<T>): void {
    this.shouldThrowIfDisposed();

    this.container.onDeactivation(ProviderTokenHelpers.toServiceIdentifier(provider), cb);
  }

  toNaked(): IProviderModuleNaked {
    return this as any;
  }

  clone(options?: CloneParams): IProviderModule {
    let providers = [...this.providers];

    if (options?.providersMap) {
      providers = providers.map((provider) => options.providersMap!(provider, this));
    }

    return new ProviderModule(
      ProviderModuleHelpers.buildInternalConstructorParams({
        isAppModule: this.isAppModule,
        identifier: this.identifier,
        defaultScope: this.defaultScope.native,
        dynamicExports: this.dynamicExports,
        onReady: this.onReady,
        onDispose: this.onDispose,
        importedProvidersMap: options?.importedProvidersMap,
        imports: [...this.imports],
        providers,
        exports: [...this.exports],
      })
    );
  }

  toString(): string {
    return this.identifier?.description ?? 'Unknown';
  }

  private setIdentifier(identifier: symbol): symbol {
    if (!identifier) throw new InjectionProviderModuleMissingIdentifierError(this);

    return identifier;
  }

  private prepareContainer(params: ProviderModuleOptionsInternal): Container {
    if (this.isAppModule) {
      return params.container?.() ?? GlobalContainer;
    } else if (params.container) {
      console.warn(`[xInjection]: The '${this.toString()}' module is using a dynamic container!`);

      return params.container();
    } else {
      return new Container({
        parent: GlobalContainer,
        defaultScope: this.defaultScope.inversify,
      });
    }
  }

  private injectImportedModules(modules?: IProviderModuleNaked[]): void {
    if (!modules || modules.length === 0) return;

    modules.forEach((module) => {
      if (module.toString() === 'GlobalAppModule') {
        throw new InjectionProviderModuleError(this, `The 'GlobalAppModule' can't be imported!`);
      }

      const moduleStaticExports = module._getExportableModulesAndProviders();
      const moduleDynamicExports = module.dynamicExports?.(this, moduleStaticExports);
      const moduleHasDynamicExports = moduleDynamicExports !== undefined;

      if (moduleHasDynamicExports) {
        this.shouldThrowWhenModuleDynamicExportsDontMatchTheStaticExports(
          module,
          moduleStaticExports,
          moduleDynamicExports
        );
      }

      (moduleDynamicExports ?? moduleStaticExports).forEach((exportable) => {
        if (exportable instanceof ProviderModule) {
          const exportableModule = exportable.toNaked();

          // The current item of the `exports` array is actually
          // another ProviderModule, therefore we must recursively drill into it
          // to import its exported modules/providers.
          this.injectImportedModules([exportableModule]);

          return;
        }

        const provider = exportable as DependencyProvider;
        const importedProvider = this.importedProvidersMap!(
          {
            scope: ProviderTokenHelpers.getInjectionScopeByPriority(provider, module.defaultScope.native),
            provide: ProviderTokenHelpers.toServiceIdentifier(provider),
            useFactory: () => module.get(provider),
            // As we are using a factory token, there is no need to include the `onEvent` and `when` properties
            // into the processed `ProviderToken` created for this imported provider,
            // because the `importedModule.get` invokation will
            // fire the `onEvent` and `when` properties of the original imported provider.
          },
          provider,
          module
        );

        this.importedProviders.set(module, [...(this.importedProviders.get(module) ?? []), importedProvider]);

        this.moduleUtils.bindToContainer(importedProvider, module.defaultScope.native);

        // Let's make sure that when the parent module unbinds the provider
        // this module unbinds it aswell.
        module._onUnbind(provider, () => this.__unbind(importedProvider));
      });
    });
  }

  private injectProviders(): void {
    this.providers.forEach((provider) => this.moduleUtils.bindToContainer(provider, this.defaultScope.native));
  }

  private registerBindingSideEffect(
    provider: ProviderToken,
    on: 'bind' | 'rebind' | 'unbind',
    cb: () => Promise<void> | void
  ): void {
    if (!this.registeredBindingSideEffects.has(provider)) {
      this.registeredBindingSideEffects.set(provider, {
        onBindEffects: [],
        onRebindEffects: [],
        onUnbindEffects: [],
      });
    }

    const providerBindingSideEffects = this.registeredBindingSideEffects.get(provider)!;

    if (on === 'bind') {
      providerBindingSideEffects.onBindEffects.push(cb);
    } else if (on === 'rebind') {
      providerBindingSideEffects.onRebindEffects.push(cb);
    } else {
      providerBindingSideEffects.onUnbindEffects.push(cb);
    }
  }

  private invokeRegisteredBindingSideEffects(provider: ProviderToken, event: 'onBind' | 'onRebind' | 'onUnbind'): void {
    const providerBindingSideEffects = this.registeredBindingSideEffects.get(provider);
    /* istanbul ignore next */
    if (!providerBindingSideEffects) return;

    providerBindingSideEffects[`${event}Effects`].forEach((cb) => cb());
  }

  private removeRegisteredBindingSideEffects(provider: ProviderToken | 'all'): void {
    /* istanbul ignore next */
    if (!this.registeredBindingSideEffects) return;

    if (provider === 'all') {
      this.registeredBindingSideEffects.forEach(({ onUnbindEffects }) => onUnbindEffects.forEach((cb) => cb()));

      return;
    }

    if (!this.registeredBindingSideEffects.has(provider)) return;

    this.registeredBindingSideEffects.get(provider)?.onUnbindEffects.forEach((cb) => cb());
    this.registeredBindingSideEffects.delete(provider);
  }

  private shouldThrowWhenModuleDynamicExportsDontMatchTheStaticExports(
    module: IProviderModuleNaked,
    staticExports: StaticExports,
    dynamicExports: StaticExports
  ): void {
    if (
      dynamicExports.length > staticExports.length ||
      dynamicExports.some((dynamicExport) => !staticExports.includes(dynamicExport))
    ) {
      throw new InjectionDynamicExportsOutOfRange(module);
    }
  }

  private shouldThrowIfDisposed(): void {
    if (this.container !== null) return;

    throw new InjectionProviderModuleDisposedError(this);
  }

  //#region IProviderModuleNaked methods

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._dispose}.
   */
  protected async _dispose(): Promise<void> {
    await this.onDispose?.(this);
    await this.__unbindAll();

    //@ts-expect-error Read-only property.
    this.container = null;
    //@ts-expect-error Read-only property.
    this.imports = null;
    //@ts-expect-error Read-only property.
    this.providers = null;
    //@ts-expect-error Read-only property.
    this.importedProviders = null;
    //@ts-expect-error Read-only property.
    this.exports = null;
    //@ts-expect-error Read-only property.
    this.dynamicExports = null;
    //@ts-expect-error Read-only property.
    this.registeredBindingSideEffects = null;

    //@ts-expect-error Read-only property.
    this.isDisposed = true;
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._lazyInit}.
   */
  protected _lazyInit({
    markAsGlobal,
    imports = [],
    providers = [],
    exports = [],
    defaultScope = InjectionScope.Singleton,
    dynamicExports,
    onReady,
    onDispose,
    ..._internalParams
  }: LazyInitOptions): IProviderModule {
    //@ts-expect-error Read-only property.
    this.isMarkedAsGlobal = markAsGlobal ?? false;
    //@ts-expect-error Read-only property.
    this.isDisposed = false;
    //@ts-expect-error Read-only property.
    this.imports = imports;
    //@ts-expect-error Read-only property.
    this.providers = providers;
    //@ts-expect-error Read-only property.
    this.importedProviders = _internalParams.importedProviders ?? new Map();
    //@ts-expect-error Read-only property.
    this.exports = exports;
    //@ts-expect-error Read-only property.
    this.defaultScope = { native: defaultScope, inversify: injectionScopeToBindingScope(defaultScope) };
    //@ts-expect-error Read-only property.
    this.dynamicExports = dynamicExports;
    //@ts-expect-error Read-only property.
    this.onReady = onReady;
    //@ts-expect-error Read-only property.
    this.onDispose = onDispose;
    //@ts-expect-error Read-only propery.
    this.importedProvidersMap = _internalParams.importedProvidersMap ?? ((provider) => provider);

    //@ts-expect-error Read-only property.
    this.container = this.prepareContainer({ ..._internalParams });
    //@ts-expect-error Read-only property.
    this.moduleUtils = new ProviderModuleUtils(this, _internalParams);
    //@ts-expect-error Read-only property.
    this.registeredBindingSideEffects = new Map();

    this.injectImportedModules(this._getImportedModules());
    this.injectProviders();

    this.onReady?.(this);

    return this;
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._getImportedModules}.
   */
  protected _getImportedModules(): IProviderModuleNaked[] {
    this.shouldThrowIfDisposed();

    return this.imports;
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._getProviders}.
   */
  protected _getProviders(): DependencyProvider[] {
    this.shouldThrowIfDisposed();

    return this.providers;
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._getExportableModulesAndProviders}.
   */
  protected _getExportableModulesAndProviders(): StaticExports {
    this.shouldThrowIfDisposed();

    return this.exports;
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._onBind}.
   */
  protected _onBind<T>(provider: ProviderToken<T>, cb: () => Promise<void> | void): void {
    this.shouldThrowIfDisposed();

    this.registerBindingSideEffect(provider, 'bind', cb);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._onRebind}.
   */
  protected _onRebind<T>(provider: ProviderToken<T>, cb: () => Promise<void> | void): void {
    this.shouldThrowIfDisposed();

    this.registerBindingSideEffect(provider, 'rebind', cb);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._onUnbind}.
   */
  protected _onUnbind<T>(provider: ProviderToken<T>, cb: () => Promise<void> | void): void {
    this.shouldThrowIfDisposed();

    this.registerBindingSideEffect(provider, 'unbind', cb);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._overwriteContainer}.
   */
  protected _overwriteContainer(cb: () => Container): void {
    //@ts-expect-error Read-only property.
    this.container = cb();
  }

  //#endregion

  //#region InversifyJS Container native methods

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__bind}.
   */
  /* istanbul ignore next */
  protected __bind<T>(provider: ProviderToken<T>): BindToFluentSyntax<T> {
    this.shouldThrowIfDisposed();

    const binding = this.container.bind(ProviderTokenHelpers.toServiceIdentifier(provider));

    this.invokeRegisteredBindingSideEffects(provider, 'onBind');

    return binding;
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__get}.
   */
  /* istanbul ignore next */
  protected __get<T>(provider: ProviderToken<T>, options?: GetOptions): T {
    this.shouldThrowIfDisposed();

    return this.container.get(ProviderTokenHelpers.toServiceIdentifier(provider), options);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__getAsync}.
   */
  /* istanbul ignore next */
  protected async __getAsync<T>(provider: ProviderToken<T>, options?: GetOptions): Promise<T> {
    this.shouldThrowIfDisposed();

    return this.container.getAsync(ProviderTokenHelpers.toServiceIdentifier(provider), options);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__getAll}.
   */
  /* istanbul ignore next */
  protected __getAll<T>(provider: ProviderToken<T>, options?: GetOptions): T[] {
    this.shouldThrowIfDisposed();

    return this.container.getAll(ProviderTokenHelpers.toServiceIdentifier(provider), options);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__getAllAsync}.
   */
  /* istanbul ignore next */
  protected async __getAllAsync<T>(provider: ProviderToken<T>, options?: GetOptions): Promise<T[]> {
    this.shouldThrowIfDisposed();

    return this.container.getAllAsync(ProviderTokenHelpers.toServiceIdentifier(provider), options);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__isBound}.
   */
  /* istanbul ignore next */
  protected __isBound(provider: ProviderToken, options?: IsBoundOptions): boolean {
    this.shouldThrowIfDisposed();

    return this.container.isBound(ProviderTokenHelpers.toServiceIdentifier(provider), options);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__isCurrentBound}.
   */
  /* istanbul ignore next */
  protected __isCurrentBound(provider: ProviderToken, options?: IsBoundOptions): boolean {
    this.shouldThrowIfDisposed();

    return this.container.isCurrentBound(ProviderTokenHelpers.toServiceIdentifier(provider), options);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__takeSnapshot}.
   */
  /* istanbul ignore next */
  protected __takeSnapshot(): void {
    this.shouldThrowIfDisposed();

    this.container.snapshot();
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__restoreSnapshot}.
   */
  /* istanbul ignore next */
  protected __restoreSnapshot(): void {
    this.shouldThrowIfDisposed();

    this.container.restore();
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__rebind}.
   */
  /* istanbul ignore next */
  protected async __rebind<T>(provider: ProviderToken<T>): Promise<BindToFluentSyntax<T>> {
    this.shouldThrowIfDisposed();

    const binding = await this.container.rebind(ProviderTokenHelpers.toServiceIdentifier(provider));

    this.invokeRegisteredBindingSideEffects(provider, 'onRebind');

    return binding;
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__rebindSync}.
   */
  /* istanbul ignore next */
  protected __rebindSync<T>(provider: ProviderToken<T>): BindToFluentSyntax<T> {
    this.shouldThrowIfDisposed();

    const binding = this.container.rebindSync(ProviderTokenHelpers.toServiceIdentifier(provider));

    this.invokeRegisteredBindingSideEffects(provider, 'onRebind');

    return binding;
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__unbind}.
   */
  /* istanbul ignore next */
  protected async __unbind(provider: ProviderToken): Promise<void> {
    this.shouldThrowIfDisposed();

    await this.container.unbind(ProviderTokenHelpers.toServiceIdentifier(provider));

    this.removeRegisteredBindingSideEffects(provider);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__unbindSync}.
   */
  /* istanbul ignore next */
  protected __unbindSync(provider: ProviderToken): void {
    this.shouldThrowIfDisposed();

    this.container.unbindSync(ProviderTokenHelpers.toServiceIdentifier(provider));

    this.removeRegisteredBindingSideEffects(provider);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__unbindAll}.
   */
  /* istanbul ignore next */
  protected async __unbindAll(): Promise<void> {
    this.shouldThrowIfDisposed();

    await this.container.unbindAll();

    this.removeRegisteredBindingSideEffects('all');
  }

  //#endregion
}
