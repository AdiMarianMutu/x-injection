import { deepClone } from '../../helpers';
import { ProviderModule, type ProviderModuleOptions } from '../provider-module';
import type { ModuleBlueprintOptions } from './interfaces';

export class ProviderModuleBlueprint {
  id: ProviderModuleOptions['id'];
  imports?: ProviderModuleOptions['imports'];
  providers?: ProviderModuleOptions['providers'];
  exports?: ProviderModuleOptions['exports'];
  defaultScope?: ProviderModuleOptions['defaultScope'];
  isGlobal?: ProviderModuleOptions['isGlobal'];
  onReady?: ProviderModuleOptions['onReady'];
  onReset?: ProviderModuleOptions['onReset'];
  onDispose?: ProviderModuleOptions['onDispose'];

  private readonly blueprintOptions: ModuleBlueprintOptions;

  constructor(
    { id, imports, providers, exports, defaultScope, isGlobal, onReady, onReset, onDispose }: ProviderModuleOptions,
    blueprintOptions?: ModuleBlueprintOptions
  ) {
    this.id = id;
    this.imports = imports;
    this.providers = providers;
    this.exports = exports;
    this.defaultScope = defaultScope;
    this.isGlobal = isGlobal;
    this.onReady = onReady;
    this.onReset = onReset;
    this.onDispose = onDispose;

    this.blueprintOptions = {
      autoImportIntoAppModuleWhenGlobal: blueprintOptions?.autoImportIntoAppModuleWhenGlobal ?? true,
    };

    this.convertToModuleAndInjectIntoAppModuleIfGlobal();
  }

  /** Returns the {@link ProviderModuleOptions} of this {@link ProviderModuleBlueprint | Blueprint}. */
  getDefinition(): ProviderModuleOptions {
    return {
      id: this.id,
      imports: this.imports,
      providers: this.providers,
      exports: this.exports,
      defaultScope: this.defaultScope,
      isGlobal: this.isGlobal,
      onReady: this.onReady,
      onReset: this.onReset,
      onDispose: this.onDispose,
    };
  }

  /**
   * Can be used to instantiate a _new_ `blueprint` with the same exact options as _this_ one.
   *
   * **Note:** _Everything is deep cloned, you can safely overwrite all the properties of the cloned instance._
   */
  clone(): ProviderModuleBlueprint {
    return new ProviderModuleBlueprint(deepClone(this.getDefinition()), { ...this.blueprintOptions });
  }

  private convertToModuleAndInjectIntoAppModuleIfGlobal(): void {
    if (!this.isGlobal || !this.blueprintOptions?.autoImportIntoAppModuleWhenGlobal) return;

    ProviderModule.APP_MODULE_REF.update.addImport(this);
  }
}
