import {
  Container,
  type BindToFluentSyntax,
  type GetOptions,
  type IsBoundOptions,
  type ServiceIdentifier,
} from 'inversify';

import { InjectionScope } from '../enums';
import {
  InjectionProviderModuleDisposedError,
  InjectionProviderModuleError,
  InjectionProviderModuleMissingIdentifierError,
} from '../errors';
import { injectionScopeToBindingScope, isPlainObject, ProviderModuleHelpers, ProviderTokenHelpers } from '../helpers';
import type {
  DependencyProvider,
  IProviderModule,
  IProviderModuleNaked,
  LazyInitOptions,
  OnGetEffects,
  ProviderModuleGetManyParam,
  ProviderModuleGetManySignature,
  ProviderModuleOptions,
  ProviderModuleOptionsInternal,
  ProviderToken,
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
  protected readonly registeredSideEffects!: IProviderModuleNaked['registeredSideEffects'];

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

  toNaked(): IProviderModuleNaked {
    return this as any;
  }

  clone(options?: Partial<ProviderModuleOptions>): IProviderModule {
    const _options = options as ProviderModuleOptionsInternal;

    const clone = new ProviderModule(
      ProviderModuleHelpers.buildInternalConstructorParams({
        isAppModule: this.isAppModule,
        markAsGlobal: this.isMarkedAsGlobal,
        identifier: this.identifier,
        defaultScope: this.defaultScope.native,
        dynamicExports: this.dynamicExports,
        onReady: this.onReady,
        onDispose: this.onDispose,
        importedProvidersMap: this.importedProvidersMap,
        imports: [...this.imports],
        providers: [...this.providers],
        exports: [...this.exports],
        ..._options,
      })
    );

    //@ts-expect-error Read-only property.
    clone.registeredSideEffects = new Map(this.registeredSideEffects);

    return clone;
  }

  async dispose(): Promise<void> {
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
    this.registeredSideEffects = null;

    //@ts-expect-error Read-only property.
    this.isDisposed = true;
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

  private injectImportedModules(modules?: (IProviderModuleNaked | (() => IProviderModuleNaked))[]): void {
    if (!modules || modules.length === 0) return;

    modules.forEach((importedModule) => {
      if (importedModule.toString() === 'GlobalAppModule') {
        throw new InjectionProviderModuleError(this, `The 'GlobalAppModule' can't be imported!`);
      }

      // The current iteration may actually be a lazy module.
      importedModule = typeof importedModule === 'function' ? importedModule() : importedModule;

      const moduleStaticExports = importedModule._getExportableModulesAndProviders();
      const moduleDynamicExports = importedModule.dynamicExports?.(this, moduleStaticExports);

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
        const serviceIdentifier = ProviderTokenHelpers.toServiceIdentifier(provider);
        const importedProvider = this.importedProvidersMap!(
          {
            scope: ProviderTokenHelpers.getInjectionScopeByPriority(provider, importedModule.defaultScope.native),
            provide: serviceIdentifier,
            useFactory: () => importedModule.get(provider),
            // As we are using a factory token, there is no need to include the `onEvent` and `when` properties
            // into the processed `ProviderToken` created for this imported provider,
            // because the `importedModule.get` invokation will
            // fire the `onEvent` and `when` properties of the original imported provider.
          },
          provider,
          importedModule
        );

        this.importedProviders.set(importedModule, [
          ...(this.importedProviders.get(importedModule) ?? []),
          importedProvider,
        ]);

        this.moduleUtils.bindToContainer(importedProvider, importedModule.defaultScope.native);
        const _importedModule = importedModule as unknown as ProviderModule;

        // Let's make sure that when the imported module unbinds the provider
        // this module unbinds it as well.
        _importedModule.onUnbindInternal(provider, this.identifier, () => this.__unbind(importedProvider));

        // But also the other way around
        this._onUnbind(importedProvider, () => {
          this.removeOnUnbindEffectsFromImportedModule(serviceIdentifier, _importedModule);
        });
      });
    });
  }

  private injectProviders(): void {
    this.providers.forEach((provider) => this.moduleUtils.bindToContainer(provider, this.defaultScope.native));
  }

  private onUnbindInternal<T>(
    provider: ProviderToken<T>,
    registerModule: symbol,
    cb: () => Promise<void> | void
  ): void {
    this.shouldThrowIfDisposed();

    this.registerBindingSideEffect(provider, 'unbind', cb, { registerModule });
  }

  private registerBindingSideEffect(
    provider: ProviderToken,
    on: 'bind' | 'get' | 'rebind' | 'unbind',
    cb: () => Promise<void> | void,
    options?: Record<string, any>
  ): void {
    const serviceIdentifier = ProviderTokenHelpers.toServiceIdentifier(provider);

    if (!this.registeredSideEffects.has(serviceIdentifier)) {
      this.registeredSideEffects.set(serviceIdentifier, {
        onBindEffects: [],
        onGetEffects: [],
        onRebindEffects: [],
        onUnbindEffects: [],
      });
    }

    const providerBindingSideEffects = this.registeredSideEffects.get(serviceIdentifier)!;

    if (on === 'bind') {
      providerBindingSideEffects.onBindEffects.push(cb);
    } else if (on === 'get') {
      providerBindingSideEffects.onGetEffects.push({ once: options!['once'], invoked: false, cb });
    } else if (on === 'rebind') {
      providerBindingSideEffects.onRebindEffects.push(cb);
    } else if (on === 'unbind') {
      providerBindingSideEffects.onUnbindEffects.push({ registerModule: options?.['registerModule'], cb });
    }
  }

  private invokeRegisteredBindingSideEffects(
    provider: ProviderToken,
    event: 'onBind' | 'onGet' | 'onRebind' | 'onUnbind'
  ): void {
    const serviceIdentifier = ProviderTokenHelpers.toServiceIdentifier(provider);

    const providerBindingSideEffects = this.registeredSideEffects.get(serviceIdentifier);
    /* istanbul ignore next */
    if (!providerBindingSideEffects) return;

    providerBindingSideEffects[`${event}Effects`].forEach((p) => {
      if (typeof p === 'function') return p();

      if (event === 'onGet') {
        const options = p as OnGetEffects;

        if (options.invoked && options.once) return;

        options.invoked = true;
      }

      p.cb();
    });
  }

  private removeRegisteredBindingSideEffects(provider: ProviderToken | 'all'): void {
    /* istanbul ignore next */
    if (!this.registeredSideEffects) return;

    if (provider === 'all') {
      this.registeredSideEffects.forEach(({ onUnbindEffects }) => onUnbindEffects.forEach((effect) => effect.cb()));
      this.registeredSideEffects.clear();

      return;
    }

    const serviceIdentifier = ProviderTokenHelpers.toServiceIdentifier(provider);

    /* istanbul ignore next */
    if (!this.registeredSideEffects.has(serviceIdentifier)) return;

    this.registeredSideEffects.get(serviceIdentifier)?.onUnbindEffects.forEach((effect) => effect.cb());
    this.registeredSideEffects.delete(serviceIdentifier);
  }

  private removeOnUnbindEffectsFromImportedModule(
    serviceIdentifier: ServiceIdentifier,
    importedModule: ProviderModule
  ): void {
    const effects = importedModule.registeredSideEffects.get(serviceIdentifier);
    if (!effects) return;

    effects.onUnbindEffects = effects.onUnbindEffects.filter((effect) => effect.registerModule !== this.identifier);
  }

  private shouldThrowIfDisposed(): void {
    if (this.container !== null) return;

    throw new InjectionProviderModuleDisposedError(this);
  }

  //#region IProviderModuleNaked methods

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
    this.registeredSideEffects = new Map();

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
  protected _getImportedModules(): (IProviderModuleNaked | (() => IProviderModuleNaked))[] {
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
   * See {@link IProviderModuleNaked._onGet}.
   */
  protected _onGet<T>(provider: ProviderToken<T>, once: boolean, cb: () => Promise<void> | void): void {
    this.shouldThrowIfDisposed();

    if (typeof once !== 'boolean') {
      throw new InjectionProviderModuleError(
        this,
        `The 'once' parameter is required when using the '${this._onGet.name}' method!`
      );
    }

    this.registerBindingSideEffect(provider, 'get', cb, { once });
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

    this.invokeRegisteredBindingSideEffects(provider, 'onGet');

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
