import { InjectionScope } from '../enums';
import type { IProviderModuleDefinition, ProviderModuleOptions } from '../types';
import { GlobalModuleRegister } from './global-modules-register';

/**
 * Can be used when you _don't_ want to initialize a `ProviderModule` eagerly as each `ProviderModule` has its own _(InversifyJS)_ container
 * initialized as soon as you do `new ProviderModule({...})`.
 *
 * The {@link ProviderModuleDefinition} allows you to just _define_ the `ProviderModule` options so you can _import_ it later into different modules.
 *
 * You can always edit a property of the definition after instantiation by doing:
 *
 * ```ts
 * const GarageModuleDefinition = new ProviderModuleDefinition({ identifier: 'GarageModuleDefinition' });
 *
 * // Later in your code
 *
 * GarageModuleDefinition.imports = [...GarageModuleDefinition.imports, PorscheModule, FerrariModuleDefinition];
 *
 * // ...
 *
 * const GarageModule = new ProviderModule(GarageModuleDefinition);
 *
 * // or
 *
 * ExistingModule.lazyImport(GarageModuleDefinition);
 * ```
 *
 * **Note:** _This means that you can't expect to be able to inject dependencies from a {@link ProviderModuleDefinition}_
 * _as how you would do with an instance of a `ProviderModule`._
 */
export class ProviderModuleDefinition implements IProviderModuleDefinition {
  identifier: IProviderModuleDefinition['identifier'];
  imports: IProviderModuleDefinition['imports'];
  providers: IProviderModuleDefinition['providers'];
  exports: IProviderModuleDefinition['exports'];
  defaultScope: IProviderModuleDefinition['defaultScope'];
  markAsGlobal: IProviderModuleDefinition['markAsGlobal'];
  onReady: IProviderModuleDefinition['onReady'];
  onDispose: IProviderModuleDefinition['onDispose'];

  constructor(moduleOptions: ProviderModuleOptions) {
    const { identifier, imports, providers, exports, defaultScope, markAsGlobal, onReady, onDispose } = moduleOptions;

    this.identifier = identifier;
    this.imports = imports;
    this.providers = providers;
    this.exports = exports;
    this.defaultScope = defaultScope ?? InjectionScope.Singleton;
    this.markAsGlobal = markAsGlobal ?? false;
    this.onReady = onReady;
    this.onDispose = onDispose;

    this.checkIfShouldBeAddedToTheGlobalRegister();
  }

  getDefinition(): ProviderModuleOptions {
    return {
      identifier: this.identifier,
      imports: this.imports,
      providers: this.providers,
      exports: this.exports,
      defaultScope: this.defaultScope,
      markAsGlobal: this.markAsGlobal,
      onReady: this.onReady,
      onDispose: this.onDispose,
    };
  }

  toString(): string {
    /* istanbul ignore next */
    return (typeof this.identifier === 'symbol' ? this.identifier.description : this.identifier) ?? 'Unknown';
  }

  private checkIfShouldBeAddedToTheGlobalRegister(): void {
    if (!this.markAsGlobal) return;

    GlobalModuleRegister.add(this);
  }
}
