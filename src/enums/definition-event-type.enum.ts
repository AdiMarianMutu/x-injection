export enum DefinitionEventType {
  /** No-Operation, yet. */
  Noop,

  /**
   * A new `module` or `blueprint` has been added.
   *
   * **Note:** _The occurred change type is: `ModuleOrBlueprint`_
   */
  Import,

  /**
   * A new `provider` has been added.
   *
   * **Note:** _The occurred change type is: `DependencyProvider`_
   */
  Provider,

  /**
   * A new `module` or `provider`  has been added to the `exports` definition.
   *
   * **Note:** _The occurred change type is: `ExportDefinition`_
   */
  Export,

  /**
   * A new `module` or `blueprint` has been added to the `exports` definition.
   *
   * **Note:** _The occurred change type is: `ModuleOrBlueprint`_
   */
  ExportModule,

  /**
   * A new `provider` has been added to the `exports` definition.
   *
   * **Note:** _The occurred change type is: `ProviderToken`_
   */
  ExportProvider,

  /**
   * A `module` has been removed.
   *
   * **Note:** _The occurred change type is: `IProviderModule`_
   */
  ImportRemoved,

  /**
   * A `provider` has been removed.
   *
   * **Note:** _The occurred change type is: `DependencyProvider`_
   */
  ProviderRemoved,

  /**
   * An `ExportDefinition` has been removed.
   *
   * **Note:** _The occurred change type is: `ExportDefinition`_
   */
  ExportRemoved,

  /**
   * A `module` has been removed from the `export` definition.
   *
   * **Note:** _The occurred change type is: `IProviderModule`_
   */
  ExportModuleRemoved,

  /**
   * A `provider` has been removed from the `export` definition.
   *
   * **Note:** _The occurred change type is: `ProviderToken`_
   */
  ExportProviderRemoved,
}
