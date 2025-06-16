import type { DefinitionEventType } from '../../enums';
import type { AsyncMethod, DependencyProvider, ExportDefinition, ModuleOrBlueprint } from '../../types';
import type { Signal } from '../../utils';
import type { IProviderModule } from '../provider-module';

export interface IDynamicModuleDefinition {
  /** Can be used to _subscribe_ in real-time to the _definition_ changes. */
  readonly subscribe: Signal<DefinitionEvent>['subscribe'];

  /**
   * Can be used to `import` a new {@link moduleOrBlueprint} into the current {@link IProviderModule | Module}.
   *
   * @param moduleOrBlueprint Either the `Module` or the `ModuleBlueprint` to be imported.
   * @param addToExports When set to `true` it'll also `export` the {@link moduleOrBlueprint}. _(defaults to `false`)_
   */
  addImport(moduleOrBlueprint: ModuleOrBlueprint, addToExports?: boolean): void;

  /**
   * Can be used to _lazily_ `import` a new {@link module} into the current {@link IProviderModule | Module}.
   *
   * **Note:** _This is useful when you want to lazy import a module from within another file._
   *
   * ```ts
   * addImportLazy(async () => import('./lazy.module'));
   * ```
   *
   * @param lazyCb An `async` callback which will resolve the {@link IProviderModule | Module} to be imported.
   * @param addToExports When set to `true` it'll also `export` the {@link module}. _(defaults to `false`)_
   */
  addImportLazy(lazyCb: AsyncMethod<IProviderModule>, addToExports?: boolean): Promise<void>;

  /**
   * Can be used to `bind` a new {@link provider} to the {@link IProviderModule | Module}'s `container`.
   *
   * @param provider The {@link DependencyProvider | Provider} to add.
   * @param addToExports When set to `true` it'll also `export` the {@link module}. _(defaults to `false`)_
   */
  addProvider<T>(provider: DependencyProvider<T>, addToExports?: boolean): void;

  /**
   * Can be used to _lazily_ `bind` a new {@link provider} to the {@link IProviderModule | Module}'s `container`.
   *
   * **Note:** _This is useful when you want to lazy import a provider from within another file._
   *
   * ```ts
   * addImportLazy(async () => import('./lazy.provider'));
   * ```
   *
   * @param lazyCb An `async` callback which will resolve the {@link DependencyProvider | Provider} to add.
   * @param addToExports When set to `true` it'll also `export` the {@link module}. _(defaults to `false`)_
   */
  addProviderLazy<T>(lazyCb: AsyncMethod<DependencyProvider<T>>, addToExports?: boolean): Promise<void>;

  /**
   * Can be used to remove an `import` from the _current_ {@link IProviderModule | Module}.
   * It'll also automatically remove it from the `exports` definition.
   *
   * **Note:** _You can always add it back with the {@link addImport} or {@link addImportLazy} methods._
   *
   * @param module The {@link IProviderModule | Module} to be removed.
   */
  removeImport(module: IProviderModule): boolean;

  /**
   * Can be used to remove a `provider` from the _current_ {@link IProviderModule | Module}'s `container`.
   * It'll also automatically remove it from the `exports` definition.
   *
   * **Note:** _You can always add it back with the {@link addProvider} or {@link addProviderLazy} methods._
   *
   * @param provider The {@link DependencyProvider | Provider} to be removed.
   */
  removeProvider<T>(provider: DependencyProvider<T>): boolean;

  /**
   * Can be used to remove a {@link IProviderModule | Module} or {@link DependencyProvider | Provider} from
   * the `exports` definition of this `module`.
   *
   * **Note:** _Consumers which already consumed the {@link exportDefinition} may still old a reference onto it._
   *
   * @param exportDefinition The {@link ExportDefinition} to be removed.
   */
  removeFromExports(exportDefinition: ExportDefinition): boolean;
}

export interface DefinitionEvent {
  /** The {@link DefinitionEventType}. */
  type: DefinitionEventType;

  /** The occurred change. */
  change: any;
}
