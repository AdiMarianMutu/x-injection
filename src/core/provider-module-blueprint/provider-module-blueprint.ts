import { deepClone } from '../../helpers';
import { ProviderModule, type ProviderModuleOptions } from '../provider-module';
import type { ModuleBlueprintOptions } from './interfaces';

export class ProviderModuleBlueprint {
  id!: ProviderModuleOptions['id'];
  imports?: ProviderModuleOptions['imports'];
  providers?: ProviderModuleOptions['providers'];
  exports?: ProviderModuleOptions['exports'];
  defaultScope?: ProviderModuleOptions['defaultScope'];
  isGlobal?: ProviderModuleOptions['isGlobal'];
  onReady?: ProviderModuleOptions['onReady'];
  onReset?: ProviderModuleOptions['onReset'];
  onDispose?: ProviderModuleOptions['onDispose'];

  private readonly blueprintOptions: ModuleBlueprintOptions;

  constructor(options: ProviderModuleOptions, blueprintOptions?: ModuleBlueprintOptions) {
    this.updateDefinition(options);

    this.blueprintOptions = {
      autoImportIntoAppModuleWhenGlobal: blueprintOptions?.autoImportIntoAppModuleWhenGlobal ?? true,
    };

    this.convertToModuleAndInjectIntoAppModuleIfGlobal();
  }

  /** Can be used to update the {@link ProviderModuleBlueprint | Blueprint} definition. */
  updateDefinition(options: ProviderModuleOptions): this {
    this.id = options.id;
    this.imports = options.imports;
    this.providers = options.providers;
    this.exports = options.exports;
    this.defaultScope = options.defaultScope;
    this.isGlobal = options.isGlobal;
    this.onReady = options.onReady;
    this.onReset = options.onReset;
    this.onDispose = options.onDispose;

    return this;
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
