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
  XInjectionDynamicExportsOutOfRange,
  XInjectionProviderModuleDisposedError,
  XInjectionProviderModuleError,
} from '../errors';
import { injectionScopeToBindingScope, isPlainObject, ProviderTokenHelpers } from '../helpers';
import type {
  IProviderModule,
  IProviderModuleNaked,
  LazyInitOptions,
  ProviderFactoryToken,
  ProviderModuleConstructor,
  ProviderModuleConstructorInternal,
  ProviderModuleGetManyParam,
  ProviderModuleGetManySignature,
  ProviderOptions,
  ProviderOrIdentifier,
  ProviderScopeOption,
  ProviderToken,
  RegisteredBindingSideEffects,
  StaticExports,
} from '../types';
import { ProviderModuleUtils } from '../utils';
import { ANONYMOUSE_MODULE_NAME } from './constants';
import { GlobalContainer } from './global-container';

/**
 * Modules are highly recommended as an effective way to organize your components.
 * For most applications, you'll likely have multiple modules, each encapsulating a closely related set of capabilities.
 *
 * _See {@link ProviderModuleConstructor | ProviderModuleOptions}_.
 *
 * @example
 * ```ts
 * import { ProviderModule } from '@adimm/x-injection';
 *
 * const EngineModule = new ProviderModule({
 *   providers: [EngineService],
 *   exports: [EngineService]
 * });
 *
 * const DashboardModule = new ProviderModule({
 *   providers: [DashboardService],
 *   exports: [DashboardService]
 * });
 *
 * const CarModule = new ProviderModule({
 *   imports: [EngineModule, DashboardModule],
 *   providers: [CarService],
 *   exports: [CarService]
 * });
 *
 * // Run-time class replacement:
 * const RedCarModule = new ProviderModule({
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
  protected readonly name!: string;
  protected readonly isAppModule: boolean;
  protected readonly container!: Container;
  protected readonly defaultScope!: IProviderModuleNaked['defaultScope'];
  protected readonly dynamicExports: IProviderModuleNaked['dynamicExports'];
  protected readonly onReady: IProviderModuleNaked['onReady'];
  protected readonly onDispose: IProviderModuleNaked['onDispose'];

  protected readonly moduleUtils!: IProviderModuleNaked['moduleUtils'];

  private readonly providers!: ProviderToken[];
  private readonly exports!: StaticExports;
  private readonly imports!: IProviderModuleNaked[];

  private readonly registeredBindingSideEffects!: RegisteredBindingSideEffects;

  constructor({
    name = ANONYMOUSE_MODULE_NAME,
    imports,
    providers,
    exports,
    defaultScope,
    dynamicExports,
    onReady,
    onDispose,
    ..._internalParams
  }: ProviderModuleConstructor) {
    const internalParams = _internalParams as ProviderModuleConstructorInternal;

    // The module name once set should never be changed!
    this.name = name;
    // Same goes for the `isAppModule`.
    this.isAppModule = internalParams.isAppModule ?? false;

    // If this module is the `AppModule`,
    // the initialization will be done when the `IProviderModuleNaked._lazyInit` method is invoked.
    if (this.isAppModule) return;

    this._lazyInit({
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

  get<T>(providerOrIdentifier: ProviderOrIdentifier<T>, isOptional?: boolean): T {
    return this.__get(providerOrIdentifier, { optional: isOptional ?? false });
  }

  getMany<D extends (ProviderModuleGetManyParam<any> | ProviderOrIdentifier)[]>(
    ...deps: D | unknown[]
  ): ProviderModuleGetManySignature<D> {
    return (deps as D).map((dep) => {
      const withOptions = isPlainObject(dep) && 'providerOrIdentifier' in dep;

      return this.get(withOptions ? dep.providerOrIdentifier : dep, withOptions ? dep.isOptional : false);
    }) as any;
  }

  onActivationEvent<T>(providerOrIdentifier: ProviderOrIdentifier<T>, cb: BindingActivation<T>): void {
    this.container.onActivation(ProviderTokenHelpers.toSimpleServiceIdentifier(providerOrIdentifier), cb);
  }

  onDeactivationEvent<T>(providerOrIdentifier: ProviderOrIdentifier<T>, cb: BindingDeactivation<T>): void {
    this.container.onDeactivation(ProviderTokenHelpers.toSimpleServiceIdentifier(providerOrIdentifier), cb);
  }

  toNaked(): IProviderModuleNaked {
    return this as any;
  }

  private prepareContainer(params: ProviderModuleConstructorInternal): Container {
    let container: Container;

    if (this.isAppModule) {
      container = params.container?.() ?? GlobalContainer;
    } else if (params.container) {
      container = params.container();
    } else {
      container = new Container({
        parent: GlobalContainer,
        defaultScope: this.defaultScope.inversify,
      });
    }

    return container;
  }

  private injectImportedModules(modules?: IProviderModuleNaked[]): void {
    if (!modules || modules.length === 0) return;

    modules.forEach((module) => {
      if (module.name === 'GlobalAppModule') {
        throw new XInjectionProviderModuleError(this, `The 'GlobalAppModule' can't be imported!`);
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
        }

        const exportableProvider = exportable as ProviderOptions<unknown> & ProviderScopeOption;

        const provider: ProviderFactoryToken<unknown> = {
          scope: exportableProvider.scope,
          provide: ProviderTokenHelpers.isSelfToken(exportableProvider as any)
            ? (exportableProvider as any)
            : exportableProvider.provide,
          useFactory: () => module.get(exportable as ProviderToken),
        };

        this.moduleUtils.bindToContainer(provider);
      });
    });
  }

  private injectProviders(): void {
    this.moduleUtils.bindManyToContainer(this.providers, this.defaultScope.native);
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
      throw new XInjectionDynamicExportsOutOfRange(module);
    }
  }

  private shouldThrowIfDisposed(): void {
    if (this.container !== null) return;

    throw new XInjectionProviderModuleDisposedError(this);
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
    this.exports = null;
    //@ts-expect-error Read-only property.
    this.dynamicExports = null;
    //@ts-expect-error Read-only property.
    this.registeredBindingSideEffects = null;
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._lazyInit}.
   */
  protected _lazyInit({
    imports = [],
    providers = [],
    exports = [],
    defaultScope = InjectionScope.Singleton,
    dynamicExports,
    onReady,
    onDispose,
    ..._internalParams
  }: LazyInitOptions): void {
    //@ts-expect-error Read-only property.
    this.imports = imports;
    //@ts-expect-error Read-only property.
    this.providers = providers;
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

    //@ts-expect-error Read-only property.
    this.container = this.prepareContainer({ ..._internalParams });
    //@ts-expect-error Read-only property.
    this.moduleUtils = new ProviderModuleUtils(this);
    //@ts-expect-error Read-only property.
    this.registeredBindingSideEffects = new Map();

    this.injectImportedModules(this._getImportedModules());
    this.injectProviders();

    this.onReady?.(this);
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
  protected _getProviders(): ProviderToken[] {
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

    const binding = this.container.bind(ProviderTokenHelpers.toSimpleServiceIdentifier(provider));

    this.invokeRegisteredBindingSideEffects(provider, 'onBind');

    return binding;
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__get}.
   */
  /* istanbul ignore next */
  protected __get<T>(providerOrIdentifier: ProviderOrIdentifier<T>, options?: GetOptions): T {
    this.shouldThrowIfDisposed();

    return this.container.get(ProviderTokenHelpers.toSimpleServiceIdentifier(providerOrIdentifier), options);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__getAsync}.
   */
  /* istanbul ignore next */
  protected async __getAsync<T>(providerOrIdentifier: ProviderOrIdentifier<T>, options?: GetOptions): Promise<T> {
    this.shouldThrowIfDisposed();

    return this.container.getAsync(ProviderTokenHelpers.toSimpleServiceIdentifier(providerOrIdentifier), options);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__getAll}.
   */
  /* istanbul ignore next */
  protected __getAll<T>(providerOrIdentifier: ProviderOrIdentifier<T>, options?: GetOptions): T[] {
    this.shouldThrowIfDisposed();

    return this.container.getAll(ProviderTokenHelpers.toSimpleServiceIdentifier(providerOrIdentifier), options);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__getAllAsync}.
   */
  /* istanbul ignore next */
  protected async __getAllAsync<T>(providerOrIdentifier: ProviderOrIdentifier<T>, options?: GetOptions): Promise<T[]> {
    this.shouldThrowIfDisposed();

    return this.container.getAllAsync(ProviderTokenHelpers.toSimpleServiceIdentifier(providerOrIdentifier), options);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__isBound}.
   */
  /* istanbul ignore next */
  protected __isBound(providerOrIdentifier: ProviderOrIdentifier, options?: IsBoundOptions): boolean {
    this.shouldThrowIfDisposed();

    return this.container.isBound(ProviderTokenHelpers.toSimpleServiceIdentifier(providerOrIdentifier), options);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked.__isCurrentBound}.
   */
  /* istanbul ignore next */
  protected __isCurrentBound(providerOrIdentifier: ProviderOrIdentifier, options?: IsBoundOptions): boolean {
    this.shouldThrowIfDisposed();

    return this.container.isCurrentBound(ProviderTokenHelpers.toSimpleServiceIdentifier(providerOrIdentifier), options);
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

    const binding = await this.container.rebind(ProviderTokenHelpers.toSimpleServiceIdentifier(provider));

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

    const binding = this.container.rebindSync(ProviderTokenHelpers.toSimpleServiceIdentifier(provider));

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

    await this.container.unbind(ProviderTokenHelpers.toSimpleServiceIdentifier(provider));

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

    this.container.unbindSync(ProviderTokenHelpers.toSimpleServiceIdentifier(provider));

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
