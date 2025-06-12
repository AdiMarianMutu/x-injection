import type { ProviderModuleOptions } from './provider-module-options';

export interface IProviderModuleDefinition extends ProviderModuleOptions {
  /** Returns the {@link ProviderModuleOptions | definition}. */
  getDefinition(): ProviderModuleOptions;

  /**
   * Can be used to _clone_ the instance of this {@link IProviderModuleDefinition | ModuleDefinition}.
   *
   * @param definition Optionally you can overwrite the definition of the clone before being returned.
   *
   * ```ts
   * const CarModuleDefinition = new ProviderModuleDefinition({
   *   identifier: 'CarModuleDefinition',
   *   providers: [CarService],
   * });
   *
   * const CarModuleDefinitionMocked = CarModuleDefinition.clone({
   *   identifier: 'CarModuleDefinitionMocked',
   *   providers: [{ provide: CarService, useClass: CarServiceMocked }]
   * });
   * ```
   */
  clone(definition?: Partial<ProviderModuleOptions>): IProviderModuleDefinition;

  /** Returns the {@link ProviderModuleOptions.identifier | identifier}. */
  toString(): string;
}
