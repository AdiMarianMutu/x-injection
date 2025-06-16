export enum MiddlewareType {
  /**
   * Can be used to register a `middleware` which will be invoked right before importing a `module` into _this_ module.
   *
   * The provided middleware `callback` can either return a `boolean` or a `ProviderModule` instance.
   *
   * **Note:** _Returning `true` can be used to pass through the middleware without modifying_
   * _the `ProviderModule` instance, while returning `false` will reject the request of importing that specific module._
   */
  BeforeAddImport,

  /**
   * Can be used to register a `middleware` which will be invoked right before adding a provider to _this_ module.
   *
   * The provided middleware `callback` can either return a `boolean` or a `ProviderToken` object type.
   *
   * **Note:** _Returning `true` can be used to pass through the middleware without modifying_
   * _the `ProviderToken` object, while returning `false` will reject the request of adding that specific provider._
   */
  BeforeAddProvider,

  /**
   * Can be used to register a `middleware` which will be invoked right before a provider is returned to the consumer from _this_ module container.
   *
   * The provided middleware `callback` can return `anything`.
   */
  BeforeGet,

  /**
   * Can be used to register a `middleware` which will be invoked right before removing an imported module from _this_ module.
   *
   * **Note:** _The provided middleware `callback` must return a `boolean` where `true` means that_
   * _the imported module can be removed and `false` means to keep it._
   */
  BeforeRemoveImport,

  /**
   * Can be used to register a `middleware` which will be invoked right before removing a provider from _this_ module.
   *
   * **Note:** _The provided middleware `callback` must return a `boolean` where `true` means that_
   * _the provider can be removed and `false` means to keep it._
   */
  BeforeRemoveProvider,

  /**
   * Can be used to register a `middleware` which will be invoked right before removing an `ExportDefinition` from _this_ module.
   *
   * **Note:** _The provided middleware `callback` must return a `boolean` where `true` means that_
   * _the `ExportDefinition` can be removed and `false` means to keep it._
   */
  BeforeRemoveExport,

  /**
   * Can be used to register a `middleware` which will be invoked each time
   * a _consumer_ `module` tries to access the `ExportDefinition` list of _this_ module to `get` a provider.
   *
   * **Note:** _The provided middleware `callback` will be invoked for each `ProviderToken` of the `ExportsDefinition` list_
   * _and must return a `boolean` where `true` means that the `ProviderToken` is authorized to be used by the importer module._
   */
  OnExportAccess,
}
