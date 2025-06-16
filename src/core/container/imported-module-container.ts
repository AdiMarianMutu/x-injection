import { ContainerModule, type ContainerModuleLoadOptions } from 'inversify';

import { DefinitionEventType, MiddlewareType } from '../../enums';
import { ProviderModuleHelpers, ProviderTokenHelpers } from '../../helpers';
import type { ExportsDefinitionOptimized, ModuleDefinition, ProviderToken } from '../../types';
import { ProviderModule } from '../provider-module/provider-module';

export class ImportedModuleContainer {
  get moduleDef(): ModuleDefinition<true> {
    return this.providerModule.dynamicModuleDef.moduleDef;
  }

  /** The {@link ProviderModule} which imported {@link providerModule | this} module. */
  private readonly importedIntoModule: ProviderModule;
  private readonly providerModule: ProviderModule;
  private readonly proxyContainer: ContainerModule;
  private proxyContainerOptions!: ContainerModuleLoadOptions;

  constructor(importedIntoModule: ProviderModule, providerModule: ProviderModule) {
    this.importedIntoModule = importedIntoModule;
    this.providerModule = providerModule;

    this.proxyContainer = this.buildProxyContainer();
  }

  dispose(): void {
    this.importedIntoModule.moduleContainer.container.unloadSync(this.proxyContainer);

    //@ts-expect-error Read-only property.
    this.importedIntoModule = null;
    //@ts-expect-error Read-only property.
    this.providerModule = null;
    //@ts-expect-error Read-only property.
    this.proxyContainer = null;
    //@ts-expect-error Read-only property.
    this.proxyContainerOptions = null;
  }

  private buildProxyContainer(): ContainerModule {
    const proxyContainer = new ContainerModule((options) => {
      this.proxyContainerOptions = options;

      this.traverseExportGraph((providerToken, foundInModule) => {
        this.proxyProviderIdentifier(providerToken, foundInModule);
      }, this.moduleDef.exports);

      // Subscribe to export changes only on this imported module.
      this.providerModule.dynamicModuleDef.event$.subscribe(({ type, change }) => {
        if (type !== DefinitionEventType.Export && type !== DefinitionEventType.ExportRemoved) return;

        const changeIsProvider = !ProviderModuleHelpers.isModule(change);

        if (changeIsProvider) {
          if (type === DefinitionEventType.Export) {
            this.proxyProviderIdentifier(change, this.providerModule);
          } else if (type === DefinitionEventType.ExportRemoved) {
            this.unproxyProviderIdentifier(change);
          }

          return;
        }

        // change is a module added or removed from exports
        const changedModule = change as ProviderModule;

        if (type === DefinitionEventType.Export) {
          // New exported module added: bind its providers recursively
          this.traverseExportGraph((providerToken, foundInModule) => {
            this.proxyProviderIdentifier(providerToken, foundInModule);
          }, changedModule.dynamicModuleDef.moduleDef.exports);
        } else {
          // Exported module removed: unbind its providers recursively
          this.traverseExportGraph((providerToken) => {
            this.unproxyProviderIdentifier(providerToken);
          }, changedModule.dynamicModuleDef.moduleDef.exports);
        }
      });
    });

    this.importedIntoModule.moduleContainer.container.loadSync(proxyContainer);

    return proxyContainer;
  }

  private proxyProviderIdentifier(providerToken: ProviderToken, fromModule: ProviderModule): void {
    const providerIdentifier = ProviderTokenHelpers.toProviderIdentifier(providerToken);

    if (this.proxyContainerOptions.isBound(providerIdentifier)) return;

    const bind = this.proxyContainerOptions.bind(providerIdentifier).toDynamicValue(() => {
      const middlewareResult = this.providerModule.middlewaresManager.applyMiddlewares(
        MiddlewareType.OnExportAccess,
        this.importedIntoModule,
        providerIdentifier
      );

      if (middlewareResult === false) {
        this.proxyContainerOptions.unbind(providerIdentifier);
        return undefined;
      }

      return fromModule.moduleContainer.container.get(providerIdentifier);
    });

    this.providerModule.moduleContainer.setBindingScope(providerToken, bind);
  }

  private unproxyProviderIdentifier(providerToken: ProviderToken): void {
    const providerIdentifier = ProviderTokenHelpers.toProviderIdentifier(providerToken);

    /* istanbul ignore next */
    if (!this.proxyContainerOptions.isBound(providerIdentifier)) return;

    this.proxyContainerOptions.unbind(providerIdentifier);
  }

  private traverseExportGraph(
    cb: (providerToken: ProviderToken, foundInModule: ProviderModule) => void,
    currentExportsNode: ExportsDefinitionOptimized
  ): void {
    // As the `exports` array can be a mix of `Providers` and `Modules`
    // we want to tap into the `exports` of an imported module as the last resort
    // as that could mean recursively going into the `exports` of the imported module and so on.
    //
    // Therefore we first iterate over the entire array and cache any module we find
    // into the `discoveredExportedModules` temporary array, then skip over the iteration,
    // this allows us to make sure that we always 1st try to get the provider from the current `export`
    // and only as a last resort to tap into the `exports` of the imported modules by iterating over the `discoveredExportedModules` temp array.

    const discoveredExportedModules: ProviderModule[] = [];

    for (const exportedModuleOrProvider of currentExportsNode) {
      const isModule = exportedModuleOrProvider instanceof ProviderModule;
      if (isModule) {
        discoveredExportedModules.push(exportedModuleOrProvider);

        // Will get to it later in the eventuality we'll not find the
        // provider into the current `exports` of the imported module.
        continue;
      } else {
        const middlewareResult = this.providerModule.middlewaresManager.applyMiddlewares(
          MiddlewareType.OnExportAccess,
          this.importedIntoModule,
          exportedModuleOrProvider
        );

        if (middlewareResult === false) continue;

        // Found it into the `exports` of this imported module.
        cb(exportedModuleOrProvider as any, this.providerModule);
      }
    }

    // If we got here it means that the `provider` has not been found in the
    // `exports` of the current imported module, therefore we must recursively drill into
    // the exported modules of the imported module.
    for (const exportedModule of discoveredExportedModules) {
      this.traverseExportGraph(cb, exportedModule.dynamicModuleDef.moduleDef.exports);
    }
  }
}
