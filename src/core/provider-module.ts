import { Container, type BindToFluentSyntax, type GetOptions, type IsBoundOptions } from 'inversify';

import { InjectionScope } from '../enums';
import {
  InjectionProviderModuleDisposedError,
  InjectionProviderModuleError,
  InjectionProviderModuleMissingIdentifierError,
} from '../errors';
import { injectionScopeToBindingScope, isPlainObject, ProviderModuleHelpers, ProviderTokenHelpers } from '../helpers';
import type {
  InternalInitOptions,
  IProviderModule,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  IProviderModuleDefinition,
  IProviderModuleNaked,
  ModuleIdentifier,
  OnGetEffects,
  ProviderModuleGetManyParam,
  ProviderModuleGetManySignature,
  ProviderModuleOptions,
  ProviderModuleOptionsInternal,
  ProviderModuleOrDefinition,
  ProviderToken,
} from '../types';
import { ProviderModuleUtils } from '../utils';
import { GlobalContainer } from './global-container';

/**
 * Modules are highly recommended as an effective way to organize your components.
 * For most applications, you'll likely have multiple modules, each encapsulating a closely related set of capabilities.
 *
 * _See {@link ProviderModuleOptions | ProviderModuleOptions}_.
 *
 * **Note:** _Check also the {@link IProviderModuleDefinition}._
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
  isDisposed: boolean = false;

  readonly identifier: ModuleIdentifier;
  isMarkedAsGlobal: boolean = false;

  protected isAppModule: IProviderModuleNaked['isAppModule'];
  protected instantiatedFromDefinition: IProviderModuleNaked['instantiatedFromDefinition'];
  protected container!: Container;
  protected defaultScope!: IProviderModuleNaked['defaultScope'];
  protected onReady: IProviderModuleNaked['onReady'];
  protected onDispose: IProviderModuleNaked['onDispose'];
  protected moduleUtils!: IProviderModuleNaked['moduleUtils'];
  protected imports!: IProviderModuleNaked['imports'];
  protected providers!: IProviderModuleNaked['providers'];
  protected exports!: IProviderModuleNaked['exports'];
  protected registeredSideEffects!: IProviderModuleNaked['registeredSideEffects'];

  constructor(options: ProviderModuleOptions | IProviderModuleDefinition) {
    const { options: opts, internalOptions } = ProviderModuleHelpers.getOptionsOrModuleDefinitionOptions(options);

    this.identifier = this.setIdentifier(opts.identifier);
    this.isDisposed = internalOptions.isDisposed ?? false;
    this.isAppModule = internalOptions.isAppModule ?? false;
    this.instantiatedFromDefinition = internalOptions.instantiatedFromDefinition ?? false;

    // If this module is the `AppModule`,
    // the initialization will be done when the `IProviderModuleNaked._internalInit` method is invoked.
    if (this.isAppModule) return;

    this._internalInit({
      ...opts,
      ...internalOptions,
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

  lazyImport(...modules: ProviderModuleOrDefinition[]): void {
    this.injectImportedModules(modules as ProviderModule[]);
  }

  toNaked(): IProviderModuleNaked {
    return this as any;
  }

  async dispose(): Promise<void> {
    const { before, after } = this.onDispose?.() ?? {};

    await before?.(this);
    await this.__unbindAll();

    //@ts-expect-error Type 'null' is not assignable to type.
    this.container = null;
    //@ts-expect-error Type 'null' is not assignable to type.
    this.imports = null;
    //@ts-expect-error Type 'null' is not assignable to type.
    this.providers = null;
    //@ts-expect-error Type 'null' is not assignable to type.
    this.exports = null;
    //@ts-expect-error Type 'null' is not assignable to type.
    this.registeredSideEffects = null;

    this.isDisposed = true;

    await after?.(this);
  }

  toString(): string {
    /* istanbul ignore next */
    return (typeof this.identifier === 'symbol' ? this.identifier.description : this.identifier) ?? 'Unknown';
  }

  private setIdentifier(identifier: ModuleIdentifier): ModuleIdentifier {
    if (!identifier) throw new InjectionProviderModuleMissingIdentifierError(this);

    return identifier;
  }

  private prepareContainer(params: ProviderModuleOptionsInternal): Container {
    if (this.isAppModule) {
      return params.container?.() ?? GlobalContainer;
    } else if (params.container) {
      console.warn(`[xInjection]: The '${this.toString()}' module is overwriting its container!`);

      return params.container();
    } else {
      return new Container({
        parent: GlobalContainer,
        defaultScope: this.defaultScope.inversify,
      });
    }
  }

  private injectImportedModules(importedModules?: ProviderModuleOrDefinition[]): void {
    if (!importedModules || importedModules.length === 0) return;

    importedModules.forEach((importedModuleOrDefinition) => {
      if (importedModuleOrDefinition.toString() === 'GlobalAppModule') {
        throw new InjectionProviderModuleError(this, `The 'GlobalAppModule' can't be imported!`);
      }

      // If the current module is marked as global
      // then let's import it into the `AppModule` automatically in order to mimic NestJS's behavior.
      if (this.shouldBeImportedIntoAppModuleFromScopedModule(importedModuleOrDefinition)) {
        this.importIntoAppModuleFromScopedModule(importedModuleOrDefinition);

        return;
      }

      const importedModule = (
        ProviderModuleHelpers.isModuleDefinition(importedModuleOrDefinition)
          ? new ProviderModule(
              ProviderModuleHelpers.buildInternalConstructorParams({
                ...importedModuleOrDefinition.getDefinition(),
                instantiatedFromDefinition: true,
              })
            )
          : importedModuleOrDefinition
      ) as ProviderModule;

      importedModule.exports.forEach((exp) => {
        const exportable = ProviderModuleHelpers.tryStaticOrLazyExportToStaticExport(this, exp);

        // This would happen when the return of the lazy export is `void`.
        if (!exportable) return;

        if (exportable instanceof ProviderModule) {
          // The current item of the `exports` array is actually
          // another ProviderModule, therefore we must recursively drill into it
          // to import its exported modules/providers.
          this.injectImportedModules([exportable]);

          return;
        }

        const providerToken = exportable as ProviderToken;
        const serviceIdentifier = ProviderTokenHelpers.toServiceIdentifier(providerToken);
        const importedProvider = {
          scope: ProviderTokenHelpers.getInjectionScopeByPriority(providerToken, importedModule.defaultScope.native),
          provide: serviceIdentifier,
          useFactory: () => importedModule.get(providerToken),
          // As we are using a factory token, there is no need to include the `onEvent` and `when` properties
          // into the processed `ProviderToken` created for this imported provider,
          // because the `importedModule.get` invokation will
          // fire the `onEvent` and `when` properties of the original imported provider.
        };

        this.moduleUtils.bindToContainer(importedProvider, importedModule.defaultScope.native);

        // It is important that we also `unbind` the imported provider when the imported module unbinds it
        // as we would not be able anymore to retrieve it because the `importedModule` unbound it.
        importedModule.registerSideEffect(providerToken, 'unbind', () => this.__unbind(importedProvider), {
          registerModuleId: this.identifier,
        });

        // It is also important that we remove our `unbind` effect frm the `importedModule` when the `unbind` method
        // will be invoked for this imported provider.
        // Not doing so, would create a side-effect where the `importedModule` would invoke `this.__unbind`
        // method on an already unbound provider, causing it to throw an error.
        this._onUnbind(serviceIdentifier, () => {
          const effects = importedModule.registeredSideEffects.get(serviceIdentifier);
          /* istanbul ignore next */
          if (!effects) return;

          effects.onUnbindEffects = effects.onUnbindEffects.filter(
            (effect) => effect.registerModuleId !== this.identifier
          );
        });
      });
    });
  }

  private shouldBeImportedIntoAppModuleFromScopedModule(moduleOrDefinition: ProviderModuleOrDefinition): boolean {
    if (this.isAppModule) return false;

    const isMarkedAsGlobal = ProviderModuleHelpers.isModuleDefinition(moduleOrDefinition)
      ? moduleOrDefinition.markAsGlobal
      : moduleOrDefinition.isMarkedAsGlobal;

    /* istanbul ignore next */
    return isMarkedAsGlobal ?? false;
  }

  private importIntoAppModuleFromScopedModule(moduleOrDefinition: ProviderModuleOrDefinition): void {
    /* istanbul ignore next */
    if (this.isAppModule) return;

    this.moduleUtils.appModule.lazyImport(moduleOrDefinition);
  }

  private injectProviders(): void {
    this.providers.forEach((provider) => this.moduleUtils.bindToContainer(provider, this.defaultScope.native));
  }

  private registerSideEffect(
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

    const providerSideEffects = this.registeredSideEffects.get(serviceIdentifier)!;

    if (on === 'bind') {
      providerSideEffects.onBindEffects.push(cb);
    } else if (on === 'get') {
      providerSideEffects.onGetEffects.push({ once: options!['once'], invoked: false, cb });
    } else if (on === 'rebind') {
      providerSideEffects.onRebindEffects.push(cb);
    } else if (on === 'unbind') {
      providerSideEffects.onUnbindEffects.push({ registerModuleId: options?.['registerModuleId'], cb });
    }
  }

  private invokeRegisteredSideEffects(
    provider: ProviderToken,
    event: 'onBind' | 'onGet' | 'onRebind' | 'onUnbind'
  ): void {
    const serviceIdentifier = ProviderTokenHelpers.toServiceIdentifier(provider);

    const providerSideEffects = this.registeredSideEffects.get(serviceIdentifier);
    /* istanbul ignore next */
    if (!providerSideEffects) return;

    providerSideEffects[`${event}Effects`].forEach((p) => {
      if (typeof p === 'function') return p();

      if (event === 'onGet') {
        const options = p as OnGetEffects;

        if (options.invoked && options.once) return;

        options.invoked = true;
      }

      p.cb();
    });
  }

  private async removeRegisteredSideEffects(provider: ProviderToken | 'all'): Promise<void> {
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

    /* istanbul ignore next */
    const unbindEffects = this.registeredSideEffects.get(serviceIdentifier)?.onUnbindEffects ?? [];
    for (const effect of unbindEffects) {
      await effect.cb();
    }

    this.registeredSideEffects.delete(serviceIdentifier);
  }

  private shouldThrowIfDisposed(): void {
    if (this.container !== null) return;

    throw new InjectionProviderModuleDisposedError(this);
  }

  //#region IProviderModuleNaked methods

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._internalInit}.
   */
  protected _internalInit(options: InternalInitOptions | IProviderModuleDefinition): IProviderModule {
    const {
      options: {
        markAsGlobal,
        imports = [],
        providers = [],
        exports = [],
        defaultScope = InjectionScope.Singleton,
        onReady,
        onDispose,
      },
      internalOptions,
    } = ProviderModuleHelpers.getOptionsOrModuleDefinitionOptions(options as any);

    this.isMarkedAsGlobal = markAsGlobal ?? false;
    this.isDisposed = false;
    this.imports = imports;
    this.providers = providers;
    this.exports = exports;
    this.defaultScope = { native: defaultScope, inversify: injectionScopeToBindingScope(defaultScope) };
    this.onReady = onReady;
    this.onDispose = onDispose;

    this.container = this.prepareContainer({ ...internalOptions });
    this.moduleUtils = new ProviderModuleUtils(this, internalOptions);
    this.registeredSideEffects = new Map();

    this.injectImportedModules(this.imports as any);
    this.injectProviders();

    this.onReady?.(this);

    return this;
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._onBind}.
   */
  protected _onBind<T>(provider: ProviderToken<T>, cb: () => Promise<void> | void): void {
    this.shouldThrowIfDisposed();

    this.registerSideEffect(provider, 'bind', cb);
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

    this.registerSideEffect(provider, 'get', cb, { once });
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._onRebind}.
   */
  protected _onRebind<T>(provider: ProviderToken<T>, cb: () => Promise<void> | void): void {
    this.shouldThrowIfDisposed();

    this.registerSideEffect(provider, 'rebind', cb);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._onUnbind}.
   */
  protected _onUnbind<T>(provider: ProviderToken<T>, cb: () => Promise<void> | void): void {
    this.shouldThrowIfDisposed();

    this.registerSideEffect(provider, 'unbind', cb);
  }

  /**
   * **Publicly visible when the instance is casted to {@link IProviderModuleNaked}.**
   *
   * See {@link IProviderModuleNaked._overwriteContainer}.
   */
  protected _overwriteContainer(cb: () => Container): void {
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

    this.invokeRegisteredSideEffects(provider, 'onBind');

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

    this.invokeRegisteredSideEffects(provider, 'onGet');

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

    this.invokeRegisteredSideEffects(provider, 'onRebind');

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

    this.invokeRegisteredSideEffects(provider, 'onRebind');

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

    await this.removeRegisteredSideEffects(provider);
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

    this.removeRegisteredSideEffects(provider);
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

    await this.removeRegisteredSideEffects('all');
  }

  //#endregion
}
