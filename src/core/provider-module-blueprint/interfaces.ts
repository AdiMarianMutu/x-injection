export interface ModuleBlueprintOptions {
  /**
   * When set to `false` you'll have to _manually_ import this blueprint
   * into the `AppModule` to make it available across all your modules.
   *
   * Defaults to `true`.
   */
  autoImportIntoAppModuleWhenGlobal?: boolean;
}
