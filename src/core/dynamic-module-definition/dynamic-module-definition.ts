import { DefinitionEventType, MiddlewareType } from '../../enums';
import { InjectionProviderModuleDisposedError, InjectionProviderModuleError } from '../../errors';
import { ProviderModuleHelpers, ProviderTokenHelpers } from '../../helpers';
import type {
  AsyncMethod,
  DependencyProvider,
  ExportDefinition,
  ModuleDefinition,
  ModuleIdentifier,
  ModuleOrBlueprint,
  ProviderIdentifier,
} from '../../types';
import { Signal } from '../../utils';
import { ImportedModuleContainer, type ModuleContainer } from '../container';
import type { IProviderModule, ProviderModuleOptions } from '../provider-module';
import type { ProviderModule } from '../provider-module/provider-module';
import type { DefinitionEvent, IDynamicModuleDefinition } from './interfaces';

export class DynamicModuleDefinition implements IDynamicModuleDefinition {
  get moduleContainer(): ModuleContainer {
    return this.providerModule.moduleContainer;
  }

  get subscribe(): IDynamicModuleDefinition['subscribe'] {
    /* istanbul ignore next */
    if (this.event$ === null) {
      throw new InjectionProviderModuleDisposedError(this.providerModule);
    }

    return this.event$.subscribe.bind(this.event$);
  }

  readonly moduleDef: ModuleDefinition<true>;
  readonly event$ = new Signal<DefinitionEvent>({
    type: DefinitionEventType.Noop,
    change: null,
  });

  private readonly providerModule: ProviderModule;
  private emittingModules = new Set<ProviderModule>();

  // Track subscriptions to imported modules' events for bubbling
  private importedModuleSubscriptions = new Map<ProviderModule, () => void>();

  constructor(providerModule: ProviderModule) {
    this.providerModule = providerModule;
    this.moduleDef = {
      imports: new Set(),
      providers: new Set(),
      exports: new Set(),
    };

    this.buildInitialDefinition(providerModule.options);
  }

  addImport(moduleOrBlueprint: ModuleOrBlueprint, addToExports = false): void {
    let providerModule = ProviderModuleHelpers.tryBlueprintToModule(moduleOrBlueprint) as ProviderModule;

    const middlewareResult = this.providerModule.middlewaresManager.applyMiddlewares<ProviderModule | false>(
      MiddlewareType.BeforeAddImport,
      providerModule
    );

    if (middlewareResult === false) return;
    providerModule = middlewareResult;

    this.moduleDef.imports.add(providerModule);

    this.createImportedModuleContainer(providerModule);

    // Subscribe to imported module's export events to bubble them
    this.subscribeToImportedModuleEvents(providerModule);

    this.emitEventSafely({
      type: DefinitionEventType.Export,
      change: providerModule,
    });

    this.emitEventSafely({
      type: DefinitionEventType.Import,
      change: providerModule,
    });

    if (!addToExports) return;

    this.moduleDef.exports.add(providerModule);

    this.emitEventSafely({
      type: DefinitionEventType.ExportModule,
      change: providerModule,
    });
  }

  async addImportLazy(lazyCb: AsyncMethod<ProviderModule>, addToExports?: boolean): Promise<void> {
    const providerModule = await lazyCb();

    this.addImport(providerModule, addToExports);
  }

  addProvider<T>(provider: DependencyProvider<T>, addToExports = false): void {
    const middlewareResult = this.providerModule.middlewaresManager.applyMiddlewares<DependencyProvider<T> | false>(
      MiddlewareType.BeforeAddProvider,
      provider
    );

    if (middlewareResult === false) return;
    provider = middlewareResult;

    this.moduleDef.providers.add(provider);

    this.moduleContainer.bindToContainer(provider);

    this.emitEventSafely({
      type: DefinitionEventType.Provider,
      change: provider,
    });

    if (!addToExports) return;

    this.moduleDef.exports.add(provider);

    this.emitEventSafely({
      type: DefinitionEventType.Export,
      change: provider,
    });

    this.emitEventSafely({
      type: DefinitionEventType.ExportProvider,
      change: provider,
    });
  }

  async addProviderLazy<T>(lazyCb: AsyncMethod<DependencyProvider<T>>, addToExports?: boolean): Promise<void> {
    const provider = await lazyCb();

    this.addProvider(provider, addToExports);
  }

  removeImport(moduleOrId: IProviderModule | ModuleIdentifier): boolean {
    const module = (
      ProviderModuleHelpers.isModule(moduleOrId) ? moduleOrId : this.getImportedModuleById(moduleOrId)
    ) as ProviderModule | undefined;
    if (!module) return false;

    const middlewareResult = this.providerModule.middlewaresManager.applyMiddlewares(
      MiddlewareType.BeforeRemoveImport,
      module
    );

    if (middlewareResult === false) return false;

    this.unsubscribeFromImportedModuleEvents(module);

    const importedModuleContainer = this.providerModule.importedModuleContainers.get(module)!;
    importedModuleContainer.dispose();
    this.providerModule.importedModuleContainers.delete(module);
    this.moduleDef.imports.delete(module);

    this.emitEventSafely({
      type: DefinitionEventType.ImportRemoved,
      change: module,
    });

    this.removeFromExports(module);

    return true;
  }

  removeProvider<T>(providerOrIdentifier: DependencyProvider<T> | ProviderIdentifier<T>): boolean {
    const provider = !ProviderTokenHelpers.isProviderIdentifier(providerOrIdentifier)
      ? providerOrIdentifier
      : this.getProviderByIdentifier(providerOrIdentifier);
    if (!provider) return false;

    const middlewareResult = this.providerModule.middlewaresManager.applyMiddlewares(
      MiddlewareType.BeforeRemoveProvider,
      provider
    );

    if (middlewareResult === false) return false;

    this.moduleDef.providers.delete(provider);
    this.moduleContainer.container.unbindSync(ProviderTokenHelpers.toProviderIdentifier(provider));

    this.emitEventSafely({
      type: DefinitionEventType.ProviderRemoved,
      change: provider,
    });

    this.removeFromExports(provider);

    return true;
  }

  removeFromExports(exportDefinition: ExportDefinition): boolean {
    if (!this.moduleDef.exports.has(exportDefinition)) return false;

    const middlewareResult = this.providerModule.middlewaresManager.applyMiddlewares(
      MiddlewareType.BeforeRemoveExport,
      exportDefinition
    );

    if (middlewareResult === false) return false;

    this.moduleDef.exports.delete(exportDefinition);

    this.emitEventSafely({
      type: DefinitionEventType.ExportRemoved,
      change: exportDefinition,
    });

    if (ProviderModuleHelpers.isModule(exportDefinition)) {
      this.emitEventSafely({
        type: DefinitionEventType.ExportModuleRemoved,
        change: exportDefinition,
      });
    } else {
      this.emitEventSafely({
        type: DefinitionEventType.ExportProviderRemoved,
        change: exportDefinition,
      });
    }

    return true;
  }

  getImportedModuleById(id: ModuleIdentifier): ProviderModule | undefined {
    return this.moduleDef.imports.values().find((x) => x.id === id) as ProviderModule;
  }

  getProviderByIdentifier<T>(identifier: ProviderIdentifier<T>): DependencyProvider<T> | undefined {
    return this.moduleDef.providers.values().find((x) => ProviderTokenHelpers.toProviderIdentifier(x) === identifier);
  }

  emitEventSafely(event: DefinitionEvent): void {
    if (this.emittingModules.has(this.providerModule)) {
      // Already emitting for this module, skip to prevent cycle
      return;
    }

    try {
      this.emittingModules.add(this.providerModule);
      this.event$.emit(event);
    } finally {
      this.emittingModules.delete(this.providerModule);
    }
  }

  dispose(): void {
    //@ts-expect-error Null not assignable.
    this.importedModuleSubscriptions = null;
    //@ts-expect-error Null not assignable.
    this.emittingModules = null;

    this.event$.dispose();
    //@ts-expect-error Read-only property.
    this.event$ = null;
    //@ts-expect-error Read-only property.
    this.moduleDef = null;
  }

  private buildInitialDefinition({ imports = [], providers = [], exports = [] }: ProviderModuleOptions): void {
    //@ts-expect-error Read-only property.
    this.moduleDef.providers = new Set(providers);

    exports.forEach((x) => {
      // We do not want to add `modules` or `blueprint` at this stage in the `exports` definition,
      // as if it is a `blueprint` we must first "convert" it to a `module`.
      // (which will happen down here in the `imports.forEach` loop)

      if (ProviderModuleHelpers.isModuleOrBlueprint(x)) return;

      this.moduleDef.exports.add(x);
    });

    imports.forEach((imp) => {
      const isModule = ProviderModuleHelpers.isModule(imp);
      const isGlobal = isModule ? (imp as ProviderModule).options.isGlobal : imp.isGlobal;

      // Importing global modules is pointless as
      // each module has access to the `AppModule`.
      if (isGlobal) return;

      const importedModule = ProviderModuleHelpers.tryBlueprintToModule(imp) as ProviderModule;
      const isPartOfTheExportsList = exports.some(
        (x) => ProviderModuleHelpers.isModuleOrBlueprint(x) && x.id === importedModule.id
      );

      this.addImport(importedModule, isPartOfTheExportsList);
    });
  }

  private createImportedModuleContainer(importedModule: ProviderModule): void {
    if (importedModule.isAppModule) {
      throw new InjectionProviderModuleError(this.providerModule, `The 'AppModule' can't be imported!`);
    }

    this.providerModule.importedModuleContainers.set(
      importedModule,
      new ImportedModuleContainer(this.providerModule, importedModule)
    );
  }

  private subscribeToImportedModuleEvents(importedModule: ProviderModule): void {
    if (this.importedModuleSubscriptions.has(importedModule)) return;

    const subscription = importedModule.dynamicModuleDef.event$.subscribe(({ type, change }) => {
      // Bubble only export-related events up to this module's event$
      switch (type) {
        case DefinitionEventType.Export:
        case DefinitionEventType.ExportRemoved:
        case DefinitionEventType.ExportModule:
        case DefinitionEventType.ExportModuleRemoved:
        case DefinitionEventType.ExportProvider:
        case DefinitionEventType.ExportProviderRemoved:
          this.emitEventSafely({ type, change });
          break;
      }
    });

    this.importedModuleSubscriptions.set(importedModule, subscription);
  }

  private unsubscribeFromImportedModuleEvents(importedModule: ProviderModule): void {
    const unsubscribe = this.importedModuleSubscriptions.get(importedModule);
    /* istanbul ignore next */
    if (!unsubscribe) return;

    unsubscribe();
    this.importedModuleSubscriptions.delete(importedModule);
  }
}
