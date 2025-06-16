import {
  InjectionError,
  InjectionProviderModuleDisposedError,
  InjectionProviderModuleMissingIdentifierError,
} from '../../errors';
import { ProviderModuleHelpers, ProviderTokenHelpers } from '../../helpers';
import type { ModuleDefinition, ModuleIdentifier, ProviderIdentifier, ProviderToken } from '../../types';
import { ModuleContainer } from '../container';
import { ImportedModuleContainer } from '../container/imported-module-container';
import { DynamicModuleDefinition, type IDynamicModuleDefinition } from '../dynamic-module-definition';
import { MiddlewaresManager, type IMiddlewaresManager } from '../middlewares-manager';
import { ProviderModuleBlueprint, type ModuleBlueprintOptions } from '../provider-module-blueprint';
import type {
  IProviderModule,
  OnCleanupOptions,
  ProviderModuleGetManyParam,
  ProviderModuleGetManyReturn,
  ProviderModuleGetReturn,
  ProviderModuleOptions,
  ProviderModuleOptionsInternal,
} from './types';

export class ProviderModule implements IProviderModule {
  get id(): ModuleIdentifier {
    return this.options.id;
  }

  get definition(): ModuleDefinition<true> {
    this.throwIfDisposed();

    return this.dynamicModuleDef.moduleDef;
  }

  get update(): IDynamicModuleDefinition {
    this.throwIfDisposed();

    return this.dynamicModuleDef;
  }

  get middlewares(): IMiddlewaresManager {
    this.throwIfDisposed();

    return this.middlewaresManager;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  get isAppModule(): boolean {
    return this.id === 'AppModule';
  }

  /**
   * Holds a reference to the `AppModule`.
   *
   * Static property needed in order to avoid introducing a _cirular dependency_ between
   * the `AppModule` instance and the `ProviderModule` class.
   *
   * **Internally used, do not use!**
   */
  static readonly APP_MODULE_REF: IProviderModule;

  readonly appModuleRef: ProviderModule;
  readonly options: ProviderModuleOptions;
  readonly middlewaresManager: MiddlewaresManager;
  readonly dynamicModuleDef: DynamicModuleDefinition;
  readonly moduleContainer: ModuleContainer;
  readonly importedModuleContainers: Map<IProviderModule, ImportedModuleContainer> = new Map();

  private disposed = false;

  constructor({
    appModuleRef: appModule = ProviderModule.APP_MODULE_REF,
    inversify,
    ...publicOptions
  }: ProviderModuleOptionsInternal) {
    this.appModuleRef = appModule as ProviderModule;
    this.options = publicOptions;

    this.throwIfIdIsMissing();

    this.middlewaresManager = new MiddlewaresManager(this);
    this.moduleContainer = new ModuleContainer(this, inversify?.parentContainer);
    this.dynamicModuleDef = new DynamicModuleDefinition(this);

    if (!this.isAppModule && this.options.isGlobal) {
      this.appModuleRef.update.addImport(this, true);
    }

    this.options.onReady?.(this);
  }

  static create(optionsOrBlueprint: ProviderModuleOptions | ProviderModuleBlueprint): IProviderModule {
    const options = ProviderModuleHelpers.isBlueprint(optionsOrBlueprint)
      ? optionsOrBlueprint.getDefinition()
      : optionsOrBlueprint;

    if (options.id === 'AppModule') {
      throw new InjectionError(
        `The 'AppModule' id can't be used as it is already being used by the built-in 'AppModule'`
      );
    }

    return new ProviderModule(options as any);
  }

  static blueprint(
    moduleOptions: ProviderModuleOptions,
    blueprintOptions?: ModuleBlueprintOptions
  ): ProviderModuleBlueprint {
    return new ProviderModuleBlueprint(moduleOptions, blueprintOptions);
  }

  isImportingModule(idOrModule: ModuleIdentifier | IProviderModule): boolean {
    this.throwIfDisposed();

    if (ProviderModuleHelpers.isModule(idOrModule)) {
      return this.importedModuleContainers.has(idOrModule);
    }

    return this.importedModuleContainers.keys().some((m) => m.id === idOrModule);
  }

  hasProvider<T>(provider: ProviderToken<T>): boolean {
    this.throwIfDisposed();

    const providerIdentifier = ProviderTokenHelpers.toProviderIdentifier(provider);

    return this.moduleContainer.container.isBound(providerIdentifier);
  }

  get<T, IsOptional extends boolean | undefined = undefined, AsList extends boolean | undefined = undefined>(
    provider: ProviderToken<T>,
    isOptional?: IsOptional,
    asList?: AsList
  ): ProviderModuleGetReturn<T, IsOptional, AsList> {
    this.throwIfDisposed();

    return this.moduleContainer.get<T, IsOptional, AsList>(provider, isOptional, asList);
  }

  getMany<D extends (ProviderModuleGetManyParam<any> | ProviderToken)[]>(
    ...deps: D | unknown[]
  ): ProviderModuleGetManyReturn<D> {
    this.throwIfDisposed();

    return this.moduleContainer.getMany<D>(...deps);
  }

  isExportingModule(idOrModule: ModuleIdentifier | IProviderModule): boolean {
    this.throwIfDisposed();

    if (!this.isImportingModule(idOrModule)) return false;

    if (ProviderModuleHelpers.isModule(idOrModule)) {
      return this.definition.exports.has(idOrModule);
    }

    // It means that we have to search by the `ModuleIdentifier` instead,
    // this may be slower, but most times should be negligible.

    return this.definition.exports.keys().some((x) => ProviderModuleHelpers.isModule(x) && x.id === idOrModule);
  }

  isExportingProvider(tokenOrIdentifier: ProviderToken | ProviderIdentifier): boolean {
    this.throwIfDisposed();

    let found = this.definition.exports.has(tokenOrIdentifier);

    if (!found && ProviderTokenHelpers.isProviderIdentifier(tokenOrIdentifier)) {
      // It means that we have to search by the `ProviderIdentifier` instead,
      // this may be slower, but most times should be negligible.

      found = this.definition.exports
        .keys()
        .some(
          (x) =>
            !ProviderModuleHelpers.isModuleOrBlueprint(x) &&
            ProviderTokenHelpers.toProviderIdentifier(x) === tokenOrIdentifier
        );
    }

    return found;
  }

  async reset(shouldInvokeCb = true): Promise<void> {
    this.throwIfDisposed();

    let before: OnCleanupOptions['before'];
    let after: OnCleanupOptions['after'];

    if (shouldInvokeCb) {
      const cbs = (this.options.onReset?.() ?? {}) as OnCleanupOptions;

      before = cbs.before;
      after = cbs.after;

      await before?.(this);
    }

    this.middlewaresManager.clear();
    this.moduleContainer.container.unbindAll();
    this.definition.imports.clear();
    this.definition.providers.clear();
    this.definition.exports.clear();
    this.importedModuleContainers.clear();

    if (shouldInvokeCb) {
      await after?.();
    }
  }

  async dispose(): Promise<void> {
    this.throwIfDisposed();

    const { before, after } = this.options.onDispose?.() ?? {};
    await before?.(this);

    await this.reset(false);

    this.middlewaresManager.dispose();
    this.dynamicModuleDef.dispose();
    /* istanbul ignore next */
    this.importedModuleContainers.forEach((x) => x.dispose());
    this.moduleContainer.dispose();

    //@ts-expect-error Read-only property.
    this.options = {
      // We leave only the `id` as it is needed
      // to correctly show it when the `InjectionProviderModuleDisposedError` is thrown.
      id: this.options.id,
    };
    //@ts-expect-error Read-only property.
    this.dynamicModuleDef = null;
    //@ts-expect-error Read-only property.
    this.importedModuleContainers = null;
    //@ts-expect-error Read-only property.
    this.moduleContainer = null;

    this.disposed = true;

    await after?.();
  }

  toString(): string {
    return this.id.toString();
  }

  private throwIfIdIsMissing(): void {
    if (!this.options.id || this.options.id.toString().trim().length === 0) {
      throw new InjectionProviderModuleMissingIdentifierError(this);
    }
  }

  private throwIfDisposed(): void {
    if (!this.isDisposed) return;

    throw new InjectionProviderModuleDisposedError(this);
  }
}
