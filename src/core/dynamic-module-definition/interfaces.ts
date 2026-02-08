import type { DefinitionEventType } from '../../enums';
import type {
  AsyncMethod,
  DependencyProvider,
  ExportDefinition,
  ModuleIdentifier,
  ModuleOrBlueprint,
  ProviderIdentifier,
} from '../../types';
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
   * Can be used to `bind` a new {@link provider} to the {@link IProviderModule | Module}'s `container`.
   *
   * @param provider The {@link DependencyProvider | Provider} to add.
   * @param addToExports When set to `true` it'll also `export` the {@link module}. _(defaults to `false`)_
   */
  addProvider<T>(provider: DependencyProvider<T>, addToExports?: boolean): void;

  /**
   * Can be used to remove an `import` from the _current_ {@link IProviderModule | Module}.
   * It'll also automatically remove it from the `exports` definition.
   *
   * **Note:** _You can always add it back with the {@link addImport} method._
   *
   * @param moduleOrId Either the `module` reference itself or its `id`.
   */
  removeImport(moduleOrId: IProviderModule | ModuleIdentifier): boolean;

  /**
   * Can be used to remove a `provider` from the _current_ {@link IProviderModule | Module}'s `container`.
   * It'll also automatically remove it from the `exports` definition.
   *
   * **Note:** _You can always add it back with the {@link addProvider} method._
   *
   * @param providerOrIdentifier Either the `provider` reference itself or its `{ provide }` property value.
   */
  removeProvider<T>(providerOrIdentifier: DependencyProvider<T> | ProviderIdentifier<T>): boolean;

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
